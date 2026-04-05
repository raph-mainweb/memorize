import { redirect } from 'next/navigation';
import Stripe from 'stripe';
import { createAdminClient } from '@/utils/supabase/admin';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, { apiVersion: '2023-10-16' as any });

interface FulfillPageProps {
  searchParams: { session_id?: string; memorial_id?: string };
}

export default async function CheckoutFulfillPage({ searchParams }: FulfillPageProps) {
  const { session_id, memorial_id: urlMemorialId } = searchParams;

  console.log(`[Fulfill] Called with session_id=${session_id}, memorial_id=${urlMemorialId}`);

  if (!session_id) {
    console.error('[Fulfill] No session_id in URL');
    redirect('/dashboard?error=no_session');
  }

  const db = createAdminClient();

  // 1. Retrieve & verify Stripe session
  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(session_id);
    console.log(`[Fulfill] Session retrieved: payment_status=${session.payment_status}, type=${session.metadata?.type}`);
  } catch (err) {
    console.error('[Fulfill] Failed to retrieve session:', err);
    redirect('/dashboard?error=invalid_session');
  }

  if (session.payment_status !== 'paid') {
    console.error(`[Fulfill] Payment not complete: ${session.payment_status}`);
    redirect('/dashboard?error=payment_not_complete');
  }

  const sessionType = session.metadata?.type;
  const userId = session.client_reference_id;
  const memorialId = session.metadata?.memorial_id || urlMemorialId;
  const productId = session.metadata?.product_id;

  console.log(`[Fulfill] userId=${userId} memorialId=${memorialId} productId=${productId} type=${sessionType}`);

  if (!userId) {
    console.error('[Fulfill] Missing client_reference_id');
    redirect('/dashboard?error=missing_user');
  }

  // 2. Idempotency: check if already fulfilled (use stripe_session_id if column exists)
  try {
    const { data: existingOrder } = await db
      .from('medallion_orders')
      .select('id')
      .eq('stripe_session_id', session_id)
      .maybeSingle();

    if (existingOrder) {
      console.log(`[Fulfill] Already fulfilled (idempotency check), redirecting.`);
      redirect(memorialId ? `/dashboard/edit/${memorialId}?success=medallion` : '/dashboard?success=medallion');
    }
  } catch {
    // stripe_session_id column might not exist — continue without idempotency check
    console.warn('[Fulfill] Could not check idempotency (column may not exist), proceeding.');
  }

  // 3. Medallion assignment
  if (sessionType === 'medallion') {
    let codeId: string | null = null;
    let codeCode: string | null = null;

    // 3a. Find code for this product first
    if (productId) {
      const { data } = await db
        .from('medallion_codes')
        .select('id, code')
        .eq('product_id', productId)
        .eq('inventory_status', 'in_stock')
        .limit(1)
        .maybeSingle();
      if (data) { codeId = data.id; codeCode = data.code; }
    }

    // 3b. Fallback: any available code
    if (!codeId) {
      const { data } = await db
        .from('medallion_codes')
        .select('id, code')
        .eq('inventory_status', 'in_stock')
        .limit(1)
        .maybeSingle();
      if (data) { codeId = data.id; codeCode = data.code; }
    }

    // 3c. Last fallback: original status field
    if (!codeId) {
      const { data } = await db
        .from('medallion_codes')
        .select('id, code')
        .eq('status', 'available')
        .limit(1)
        .maybeSingle();
      if (data) { codeId = data.id; codeCode = data.code; }
    }

    console.log(`[Fulfill] Code found: id=${codeId} code=${codeCode}`);

    const now = new Date().toISOString();

    if (codeId) {
      // 3d. Assign the code
      const { error: assignErr } = await db
        .from('medallion_codes')
        .update({
          status: 'assigned',
          inventory_status: 'assigned',
          memorial_id: memorialId || null,        // original schema field
          assigned_page_id: memorialId || null,   // new field
          assigned_user_id: userId,               // new field
          assigned_at: now,
          connected_at: now,
        })
        .eq('id', codeId);

      if (assignErr) {
        console.error(`[Fulfill] Code assign error (trying with base fields):`, assignErr.message);
        // Retry with only original schema fields
        await db.from('medallion_codes').update({
          status: 'assigned',
          memorial_id: memorialId || null,
          assigned_at: now,
        }).eq('id', codeId);
      } else {
        console.log(`[Fulfill] ✓ Code ${codeCode} assigned to user ${userId} / memorial ${memorialId}`);
      }
    } else {
      console.error(`[Fulfill] ✗ No available code found for product ${productId}!`);
    }

    // 3e. Save shipping from metadata
    const shippingJson = session.metadata?.shipping_json;
    if (shippingJson) {
      try {
        const s = JSON.parse(shippingJson);
        const { error: profileErr } = await db.from('profiles').update({
          first_name: s.first_name || null,
          last_name: s.last_name || null,
          address_line1: s.address_line1 || null,
          address_line2: s.address_line2 || null,
          postal_code: s.postal_code || null,
          city: s.city || null,
          country: s.country || null,
          phone: s.phone || null,
        }).eq('id', userId);
        if (profileErr) console.error('[Fulfill] Profile save error:', profileErr.message);
        else console.log(`[Fulfill] ✓ Shipping saved to profile`);
      } catch (e) {
        console.error('[Fulfill] Failed to parse shipping_json:', e);
      }
    }

    // 3f. Create order record — try full insert first, fallback to minimal
    const fullInsert = {
      user_id: userId,
      medallion_code_id: codeId,
      shipping_address: shippingJson || JSON.stringify(session.customer_details?.address) || 'Unbekannt',
      memorial_id: memorialId || null,
      product_id: productId || null,
      status: codeId ? 'processing' : 'pending_stock',
      stripe_session_id: session_id,
    };

    const { error: insertErr } = await db.from('medallion_orders').insert(fullInsert);
    if (insertErr) {
      console.error(`[Fulfill] Full insert failed (${insertErr.message}), trying minimal...`);
      // Minimal insert with only original schema columns
      const { error: minErr } = await db.from('medallion_orders').insert({
        user_id: userId,
        medallion_code_id: codeId,
        shipping_address: shippingJson || 'Unbekannt',
      });
      if (minErr) console.error('[Fulfill] Minimal insert also failed:', minErr.message);
      else console.log('[Fulfill] ✓ Minimal order created (run SQL migration 7 for full support)');
    } else {
      console.log(`[Fulfill] ✓ Full order created`);
    }
  }

  // 4. Redirect to success
  const dest = memorialId ? `/dashboard/edit/${memorialId}?success=medallion` : '/dashboard?success=medallion';
  console.log(`[Fulfill] Redirecting to ${dest}`);
  redirect(dest);
}
