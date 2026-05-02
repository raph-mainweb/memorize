import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/utils/supabase/admin';
import { Resend } from 'resend';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  apiVersion: '2023-10-16' as any,
});

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const payload = await req.text();
  const signature = req.headers.get('Stripe-Signature');

  if (!signature) return NextResponse.json({ error: 'Missing signature' }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (err: unknown) {
    const error = err as Error;
    console.error('[Webhook] verify failed:', error.message);
    return NextResponse.json({ error: `Webhook Error: ${error.message}` }, { status: 400 });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutCompleted(session);
    }
    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('[Webhook] logic error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ── Main Handler ─────────────────────────────────────────────────────────────

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const db = createAdminClient();

  const userId = session.client_reference_id;
  const flow = session.metadata?.flow;
  const pageId = session.metadata?.page_id || null;
  const shopifyProductId = session.metadata?.shopify_product_id || null;
  const shopifyHandle = session.metadata?.shopify_handle || null;
  const userEmail = session.metadata?.user_email || session.customer_details?.email || '';

  console.log(`[Webhook] session=${session.id} flow=${flow} user=${userId} page=${pageId} product=${shopifyProductId}`);

  // ── Backwards compatibility: legacy type-based sessions ───────────────────
  const legacyType = session.metadata?.type;
  const legacyUnlock = session.metadata?.unlock === 'true';

  if (!flow) {
    // Old-style sessions — preserve existing behavior
    if (legacyType === 'medallion') {
      await assignMedallionCode(db, session, userId!, pageId, shopifyProductId, shopifyHandle);
    }
    if (legacyUnlock && pageId) {
      await unlockPage(db, pageId, userId!);
    }
    return;
  }

  // ── v3 Flow routing ───────────────────────────────────────────────────────
  switch (flow) {
    case 'A':
    case 'C':
      // Seite freischalten — Ownership bereits beim Session-Create geprüft
      if (pageId && userId) {
        await unlockPage(db, pageId, userId);
      } else {
        throw new Error(`[Flow ${flow}] Missing pageId or userId`);
      }
      break;

    case 'B1':
      // Medaillon kaufen + Seite freischalten (für mich)
      if (!userId) throw new Error('[Flow B1] Missing userId');
      // 1. Assign medallion code + create order
      await assignMedallionCode(db, session, userId, pageId, shopifyProductId, shopifyHandle);
      // 2. Add QR credit (user can scan QR after delivery and link it)
      await addQrCredit(db, userId, 1);
      // 3. If a page_id was passed, unlock it too
      if (pageId) {
        await unlockPage(db, pageId, userId);
      }
      break;

    case 'B2':
      // Medaillon kaufen als Geschenk → Aktivierungstoken erstellen
      // Note: userId may be 'guest' for non-logged-in buyers
      {
        const orderRow = await assignMedallionCode(db, session, userId || 'guest', pageId, shopifyProductId, shopifyHandle);
        const token = await createActivationToken(db, orderRow?.id || null);
        if (userEmail && token) {
          await sendGiftConfirmationEmail(userEmail, token);
        }
      }
      break;

    case 'E':
      // Medaillon zu bestehender LIVE-Seite — nur QR-Guthaben, KEIN Seiten-Unlock
      if (!userId) throw new Error('[Flow E] Missing userId');
      await assignMedallionCode(db, session, userId, pageId, shopifyProductId, shopifyHandle);
      await addQrCredit(db, userId, 1);
      break;

    default:
      console.warn(`[Webhook] Unknown flow: ${flow} — session ${session.id}`);
  }
}

// ── Helper: Unlock Page ───────────────────────────────────────────────────────

async function unlockPage(
  db: ReturnType<typeof createAdminClient>,
  pageId: string,
  userId: string
): Promise<void> {
  // Idempotency: if already live, skip silently
  const { data: page } = await db
    .from('memorial_pages')
    .select('is_live, user_id')
    .eq('id', pageId)
    .single();

  if (!page) throw new Error(`[unlockPage] Page ${pageId} not found`);
  if (page.user_id !== userId) throw new Error(`[unlockPage] Ownership mismatch for page ${pageId}`);
  if (page.is_live) {
    console.log(`[unlockPage] Page ${pageId} already live — skipping (idempotent)`);
    return;
  }

  const { error } = await db
    .from('memorial_pages')
    .update({ is_live: true })
    .eq('id', pageId);

  if (error) throw new Error(`[unlockPage] DB error: ${error.message}`);
  console.log(`[unlockPage] Page ${pageId} is now LIVE`);
}

// ── Helper: Assign Medallion Code ────────────────────────────────────────────

async function assignMedallionCode(
  db: ReturnType<typeof createAdminClient>,
  session: Stripe.Checkout.Session,
  userId: string,
  pageId: string | null,
  shopifyProductId: string | null,
  shopifyHandle: string | null
): Promise<{ id: string } | null> {
  // Find available code
  let codeId: string | null = null;
  let codeValue: string | null = null;

  if (shopifyProductId) {
    const { data: available } = await db
      .from('medallion_codes')
      .select('id, code')
      .eq('shopify_product_id', shopifyProductId)
      .eq('inventory_status', 'in_stock')
      .limit(1)
      .single();

    if (available) {
      codeId = available.id;
      codeValue = available.code;
    } else {
      console.warn(`[assignMedallionCode] No in_stock code for shopify_product_id=${shopifyProductId}`);
    }
  }

  // Build shipping address
  const shippingRaw = session.metadata?.shipping_json;
  const shippingAddress = shippingRaw ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    JSON.stringify((session as unknown as Record<string, unknown>).shipping_details || session.customer_details?.address) ||
    'Unbekannt';

  let orderId: string | null = null;

  if (codeId) {
    const now = new Date().toISOString();
    await db.from('medallion_codes').update({
      inventory_status: 'assigned',
      status: 'assigned',
      assigned_user_id: userId !== 'guest' ? userId : null,
      assigned_page_id: pageId || null,
      memorial_id: pageId || null,
      assigned_at: now,
      stripe_session_id: session.id,
    }).eq('id', codeId);
    console.log(`[assignMedallionCode] Code ${codeValue} assigned to user ${userId}`);
  } else {
    console.error(`[assignMedallionCode] No code available for product ${shopifyProductId} — order as pending_stock`);
  }

  // Create order record
  const { data: order } = await db.from('medallion_orders').insert({
    user_id: userId !== 'guest' ? userId : null,
    medallion_code_id: codeId || null,
    shipping_address: shippingAddress,
    memorial_id: pageId || null,
    shopify_product_id: shopifyProductId || null,
    shopify_handle: shopifyHandle || null,
    status: codeId ? 'processing' : 'pending_stock',
    stripe_session_id: session.id,
  }).select('id').single();

  orderId = order?.id || null;

  // Save shipping to profile
  if (shippingRaw && userId && userId !== 'guest') {
    try {
      const shipping = JSON.parse(shippingRaw) as Record<string, string>;
      await db.from('profiles').update({
        first_name: shipping.first_name || null,
        last_name: shipping.last_name || null,
        address_line1: shipping.address_line1 || null,
        address_line2: shipping.address_line2 || null,
        postal_code: shipping.postal_code || null,
        city: shipping.city || null,
        country: shipping.country || null,
        phone: shipping.phone || null,
      }).eq('id', userId);
    } catch (e) {
      console.error('[assignMedallionCode] Failed to parse shipping JSON:', e);
    }
  }

  return orderId ? { id: orderId } : null;
}

// ── Helper: Add QR Credit ─────────────────────────────────────────────────────

async function addQrCredit(
  db: ReturnType<typeof createAdminClient>,
  userId: string,
  amount: number
): Promise<void> {
  // Atomic increment via RPC to avoid race conditions
  const { error } = await db.rpc('increment_qr_credits', {
    p_user_id: userId,
    p_amount: amount,
  });

  if (error) {
    // Fallback: manual update if RPC not available
    console.warn('[addQrCredit] RPC failed, using manual update:', error.message);
    const { data: profile } = await db
      .from('profiles')
      .select('qr_credits')
      .eq('id', userId)
      .single();
    const current = profile?.qr_credits ?? 0;
    await db.from('profiles').update({ qr_credits: current + amount }).eq('id', userId);
  }
  console.log(`[addQrCredit] +${amount} credits for user ${userId}`);
}

// ── Helper: Create Activation Token (Flow B2) ────────────────────────────────

async function createActivationToken(
  db: ReturnType<typeof createAdminClient>,
  orderId: string | null
): Promise<string | null> {
  const { data, error } = await db
    .from('activation_tokens')
    .insert({ order_id: orderId })
    .select('token')
    .single();

  if (error) {
    console.error('[createActivationToken] DB error:', error.message);
    return null;
  }
  console.log(`[createActivationToken] Created token for order ${orderId}: ${data.token}`);
  return data.token as string;
}

// ── Helper: Send Gift Confirmation Email ──────────────────────────────────────

async function sendGiftConfirmationEmail(
  buyerEmail: string,
  token: string
): Promise<void> {
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || '';
  const activationUrl = `${APP_URL}/m/activate?token=${token}`;

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
      to: buyerEmail,
      subject: 'Ihr Nachklang Medaillon – Aktivierungsanleitung',
      html: `
        <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
          <h1 style="font-size: 24px; font-weight: 400; margin-bottom: 8px;">Vielen Dank für Ihr Nachklang Medaillon.</h1>
          <p style="font-size: 15px; line-height: 1.7; color: #555; margin-bottom: 24px;">
            Das Medaillon ist auf dem Weg. Sobald es angekommen ist, kann der Beschenkte damit eine persönliche Gedenkseite einrichten.
          </p>
          <p style="font-size: 15px; line-height: 1.7; color: #555; margin-bottom: 16px;">
            <strong>Ihr persönlicher Aktivierungscode:</strong>
          </p>
          <div style="background: #f5f4f0; border-radius: 8px; padding: 20px 24px; font-family: monospace; font-size: 18px; letter-spacing: 0.05em; margin-bottom: 24px; color: #1a1a1a;">
            ${token}
          </div>
          <p style="font-size: 14px; color: #777; margin-bottom: 24px;">
            Dieser Code ist 90 Tage gültig und kann nur einmal verwendet werden.
          </p>
          <a href="${activationUrl}" style="display: inline-block; background: #1a1a1a; color: #fff; text-decoration: none; padding: 14px 28px; border-radius: 32px; font-size: 15px;">
            Gedenkseite aktivieren →
          </a>
          <p style="font-size: 12px; color: #aaa; margin-top: 32px;">
            Nachklang CH · Schweizer Gedenkseiten
          </p>
        </div>
      `,
    });
    console.log(`[sendGiftEmail] Confirmation sent to ${buyerEmail}`);
  } catch (e) {
    console.error('[sendGiftEmail] Failed to send email:', e);
  }
}
