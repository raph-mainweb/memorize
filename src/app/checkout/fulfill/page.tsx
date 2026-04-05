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

  console.log(`[Fulfill] START session_id=${session_id}`);

  if (!session_id) redirect('/dashboard?error=no_session');

  const db = createAdminClient();

  // 1. Retrieve & verify Stripe session
  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(session_id);
  } catch (err) {
    console.error('[Fulfill] Stripe retrieve failed:', err);
    redirect('/dashboard?error=invalid_session');
  }

  if (session.payment_status !== 'paid') redirect('/dashboard?error=payment_not_complete');

  const sessionType = session.metadata?.type;
  const userId = session.client_reference_id;
  const memorialId = session.metadata?.memorial_id || urlMemorialId;
  const productId = session.metadata?.product_id;
  const shippingJson = session.metadata?.shipping_json;

  console.log(`[Fulfill] paid ✓ | type=${sessionType} | user=${userId} | memorial=${memorialId}`);

  if (!userId) redirect('/dashboard?error=missing_user');

  // 2. Idempotency check (skip if column missing)
  try {
    const { data: existing } = await db
      .from('medallion_orders')
      .select('id')
      .eq('stripe_session_id', session_id)
      .maybeSingle();
    if (existing) {
      console.log('[Fulfill] Already fulfilled, redirecting');
      redirect(memorialId ? `/dashboard/edit/${memorialId}?success=medallion` : '/dashboard?success=medallion');
    }
  } catch { console.warn('[Fulfill] Idempotency check skipped'); }

  // 3. Medallion fulfillment
  if (sessionType === 'medallion') {
    // --- 3a. Find an available code ---
    let codeId: string | null = null;

    // Try by product + inventory_status
    if (productId) {
      const { data } = await db.from('medallion_codes').select('id')
        .eq('product_id', productId).eq('inventory_status', 'in_stock').limit(1).maybeSingle();
      if (data?.id) codeId = data.id;
    }
    // Fallback: any in_stock
    if (!codeId) {
      const { data } = await db.from('medallion_codes').select('id')
        .eq('inventory_status', 'in_stock').limit(1).maybeSingle();
      if (data?.id) codeId = data.id;
    }
    // Last fallback: original status=available field
    if (!codeId) {
      const { data } = await db.from('medallion_codes').select('id')
        .eq('status', 'available').limit(1).maybeSingle();
      if (data?.id) codeId = data.id;
    }

    console.log(`[Fulfill] Code found: ${codeId}`);

    // --- 3b. Assign the code --- (each field separately to isolate failures)
    if (codeId) {
      const now = new Date().toISOString();

      // Update base fields (these exist in original schema)
      const { error: e1 } = await db.from('medallion_codes')
        .update({ status: 'assigned', memorial_id: memorialId || null, assigned_at: now })
        .eq('id', codeId);
      if (e1) console.error('[Fulfill] Base code update error:', e1.message);
      else console.log('[Fulfill] ✓ Code base fields assigned');

      // Update new lifecycle fields (may not exist — ignore errors)
      await db.from('medallion_codes')
        .update({ inventory_status: 'assigned' })
        .eq('id', codeId);

      await db.from('medallion_codes')
        .update({ assigned_user_id: userId })
        .eq('id', codeId);

      await db.from('medallion_codes')
        .update({ assigned_page_id: memorialId || null, connected_at: now })
        .eq('id', codeId);
    } else {
      console.error('[Fulfill] ✗ No available code found!');
    }

    // --- 3c. Create order (try multiple insertions, increasingly minimal) ---
    const shippingStr = shippingJson || JSON.stringify(session.customer_details?.address) || 'Unbekannt';

    // Attempt 1: Full insert with all fields
    const { error: err1 } = await db.from('medallion_orders').insert({
      user_id: userId,
      medallion_code_id: codeId,
      shipping_address: shippingStr,
      memorial_id: memorialId || null,
      product_id: productId || null,
      status: codeId ? 'processing' : 'pending_stock',
      stripe_session_id: session_id,
    });

    if (err1) {
      console.error('[Fulfill] Full insert failed:', err1.message);

      // Attempt 2: Without medallion_code_id (in case it's not in cache)
      const { error: err2 } = await db.from('medallion_orders').insert({
        user_id: userId,
        shipping_address: shippingStr,
        memorial_id: memorialId || null,
        product_id: productId || null,
        status: codeId ? 'processing' : 'pending_stock',
        stripe_session_id: session_id,
      });

      if (err2) {
        console.error('[Fulfill] Insert without code_id failed:', err2.message);

        // Attempt 3: Absolute minimum (original schema only)
        const { error: err3 } = await db.from('medallion_orders').insert({
          user_id: userId,
          shipping_address: shippingStr,
        });
        if (err3) console.error('[Fulfill] ✗ All inserts failed:', err3.message);
        else console.log('[Fulfill] ✓ Minimal order created (NOTIFY pgrst required for full schema)');
      } else {
        console.log('[Fulfill] ✓ Order created without medallion_code_id ref');
      }
    } else {
      console.log('[Fulfill] ✓ Full order created');
    }

    // --- 3d. Save shipping to profile ---
    if (shippingJson) {
      try {
        const s = JSON.parse(shippingJson);
        const { error: pe } = await db.from('profiles').update({
          first_name: s.first_name || null, last_name: s.last_name || null,
          address_line1: s.address_line1 || null, address_line2: s.address_line2 || null,
          postal_code: s.postal_code || null, city: s.city || null,
          country: s.country || null, phone: s.phone || null,
        }).eq('id', userId);
        if (pe) console.error('[Fulfill] Profile update failed:', pe.message);
        else console.log('[Fulfill] ✓ Shipping saved to profile');
      } catch (e) { console.error('[Fulfill] shipping_json parse error:', e); }
    }
  }

  const dest = memorialId
    ? `/dashboard/edit/${memorialId}?success=medallion`
    : '/dashboard?success=medallion';
  console.log(`[Fulfill] Done → ${dest}`);
  redirect(dest);
}
