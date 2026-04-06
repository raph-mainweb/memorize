import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/utils/supabase/admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  apiVersion: '2023-10-16' as any,
});

export async function POST(req: NextRequest) {
  const payload = await req.text();
  const signature = req.headers.get('Stripe-Signature');

  if (!signature) return NextResponse.json({ error: 'Missing signature' }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET as string);
  } catch (err: unknown) {
    const error = err as Error;
    console.error(`[Webhook] verify failed:`, error.message);
    return NextResponse.json({ error: `Webhook Error: ${error.message}` }, { status: 400 });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutSessionCompleted(session);
    }
    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    const error = err as Error;
    console.error(`[Webhook] logic error:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const supabase = createAdminClient();
  const userId = session.client_reference_id;
  const memorialId = session.metadata?.memorial_id;
  // New: Shopify product reference (replaces old Supabase product_id)
  const shopifyProductId = session.metadata?.shopify_product_id;
  const shopifyHandle = session.metadata?.shopify_handle;
  const sessionType = session.metadata?.type;

  console.log(`[Webhook] session ${session.id} | type=${sessionType} | user=${userId} | memorial=${memorialId} | shopify_product=${shopifyProductId}`);

  if (!userId) throw new Error('Missing client_reference_id');

  // -----------------------------------------------------------------
  // 1. MEDALLION PURCHASE — detect via metadata.type === 'medallion'
  // -----------------------------------------------------------------
  const isMedallionPurchase = sessionType === 'medallion';

  if (isMedallionPurchase) {
    console.log(`[Webhook] Medallion purchase → assigning code...`);

    // 1a. Find an available medallion for this product
    let codeId: string | null = null;
    let codeCode: string | null = null;

    if (shopifyProductId) {
      const { data: available } = await supabase
        .from('medallion_codes')
        .select('id, code')
        .eq('shopify_product_id', shopifyProductId)
        .eq('inventory_status', 'in_stock')
        .limit(1)
        .single();

      if (available) {
        codeId = available.id;
        codeCode = available.code;
      }
    }

    // Fallback: any available code regardless of product
    if (!codeId) {
      const { data: anyCode } = await supabase
        .from('medallion_codes')
        .select('id, code')
        .eq('inventory_status', 'in_stock')
        .limit(1)
        .single();
      if (anyCode) { codeId = anyCode.id; codeCode = anyCode.code; }
    }

    if (codeId) {
      // 1b. Assign the code
      const now = new Date().toISOString();
      const { error: assignError } = await supabase
        .from('medallion_codes')
        .update({
          inventory_status: 'assigned',
          status: 'assigned',
          assigned_user_id: userId,
          assigned_page_id: memorialId || null,
          connected_at: now,
          assigned_at: now,
        })
        .eq('id', codeId);

      if (assignError) {
        console.error(`[Webhook] Code assign error:`, assignError.message);
      } else {
        console.log(`[Webhook] Code ${codeCode} assigned to user ${userId}, memorial ${memorialId}`);
      }

      // 1c. Store order record
      const shippingRaw = session.metadata?.shipping_json;
      const shippingAddress = shippingRaw || JSON.stringify(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session as any).shipping_details || session.customer_details?.address
      ) || 'Unbekannt';

      await supabase.from('medallion_orders').insert({
        user_id: userId,
        medallion_code_id: codeId,
        shipping_address: shippingAddress,
        memorial_id: memorialId || null,
        shopify_product_id: shopifyProductId || null,
        shopify_handle: shopifyHandle || null,
        status: 'processing',
        stripe_session_id: session.id,
      });

      // 1d. Save shipping address back to profile (if provided via metadata)
      if (shippingRaw) {
        try {
          const shipping = JSON.parse(shippingRaw) as {
            first_name?: string; last_name?: string;
            address_line1?: string; address_line2?: string;
            postal_code?: string; city?: string; country?: string; phone?: string;
          };
          await supabase.from('profiles').update({
            first_name: shipping.first_name || null,
            last_name: shipping.last_name || null,
            address_line1: shipping.address_line1 || null,
            address_line2: shipping.address_line2 || null,
            postal_code: shipping.postal_code || null,
            city: shipping.city || null,
            country: shipping.country || null,
            phone: shipping.phone || null,
          }).eq('id', userId);
          console.log(`[Webhook] Shipping address saved to profile for user ${userId}`);
        } catch (e) {
          console.error(`[Webhook] Failed to parse shipping JSON:`, e);
        }
      }
    } else {
      console.error(`[Webhook] No available medallion code found for shopify_product ${shopifyProductId} — order logged WITHOUT code assignment!`);
      await supabase.from('medallion_orders').insert({
        user_id: userId,
        shipping_address: JSON.stringify(session.customer_details?.address) || 'Unbekannt',
        memorial_id: memorialId || null,
        shopify_product_id: shopifyProductId || null,
        shopify_handle: shopifyHandle || null,
        status: 'pending_stock',
        stripe_session_id: session.id,
      });
    }
  }

  // -----------------------------------------------------------------
  // 2. UNLOCK PURCHASE
  // -----------------------------------------------------------------
  const isUnlockPurchase = sessionType === 'unlock' || session.metadata?.unlock === 'true';

  if (isUnlockPurchase && memorialId) {
    const { error } = await supabase
      .from('memorial_pages')
      .update({ is_live: true })
      .eq('id', memorialId)
      .eq('user_id', userId);

    if (error) throw new Error(`Unlock fail: ${error.message}`);
    console.log(`[Webhook] Memorial ${memorialId} unlocked.`);
  }
}
