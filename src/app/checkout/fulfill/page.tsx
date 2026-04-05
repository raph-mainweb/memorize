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

  if (!session_id) redirect('/dashboard?error=no_session');

  const db = createAdminClient();

  // 1. Retrieve & verify Stripe session
  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(session_id);
  } catch (err) {
    console.error('[Fulfill] Failed to retrieve session:', err);
    redirect('/dashboard?error=invalid_session');
  }

  if (session.payment_status !== 'paid') {
    redirect('/dashboard?error=payment_not_complete');
  }

  const sessionType = session.metadata?.type;
  const userId = session.client_reference_id;
  const memorialId = session.metadata?.memorial_id || urlMemorialId;
  const productId = session.metadata?.product_id;

  if (!userId) redirect('/dashboard?error=missing_user');

  // 2. Idempotency: check if already fulfilled
  const { data: existingOrder } = await db
    .from('medallion_orders')
    .select('id, medallion_code_id')
    .eq('stripe_session_id', session_id)
    .maybeSingle();

  if (existingOrder) {
    // Already fulfilled — just redirect to success
    console.log(`[Fulfill] Session ${session_id} already fulfilled, skipping.`);
    redirect(memorialId ? `/dashboard/edit/${memorialId}?success=medallion` : '/dashboard?success=medallion');
  }

  // 3. Medallion assignment
  if (sessionType === 'medallion') {
    let codeId: string | null = null;
    let codeCode: string | null = null;

    // Find best available code for this product
    if (productId) {
      const { data: byProduct } = await db
        .from('medallion_codes')
        .select('id, code')
        .eq('product_id', productId)
        .eq('inventory_status', 'in_stock')
        .limit(1)
        .maybeSingle();
      if (byProduct) { codeId = byProduct.id; codeCode = byProduct.code; }
    }

    // Fallback: any in-stock code
    if (!codeId) {
      const { data: anyCode } = await db
        .from('medallion_codes')
        .select('id, code')
        .eq('inventory_status', 'in_stock')
        .limit(1)
        .maybeSingle();
      if (anyCode) { codeId = anyCode.id; codeCode = anyCode.code; }
    }

    const now = new Date().toISOString();

    if (codeId) {
      // Assign the code
      const { error: assignErr } = await db
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

      if (assignErr) {
        console.error(`[Fulfill] Code assign error:`, assignErr.message);
      } else {
        console.log(`[Fulfill] Code ${codeCode} assigned → user ${userId}, memorial ${memorialId}`);
      }
    } else {
      console.error(`[Fulfill] No available code for product ${productId}!`);
    }

    // Save shipping from metadata to profile
    const shippingJson = session.metadata?.shipping_json;
    if (shippingJson) {
      try {
        const s = JSON.parse(shippingJson) as {
          first_name?: string; last_name?: string; address_line1?: string;
          address_line2?: string; postal_code?: string; city?: string; country?: string; phone?: string;
        };
        await db.from('profiles').update({
          first_name: s.first_name || null, last_name: s.last_name || null,
          address_line1: s.address_line1 || null, address_line2: s.address_line2 || null,
          postal_code: s.postal_code || null, city: s.city || null,
          country: s.country || null, phone: s.phone || null,
        }).eq('id', userId);
        console.log(`[Fulfill] Shipping saved to profile ${userId}`);
      } catch (e) {
        console.error('[Fulfill] Failed to parse shipping_json:', e);
      }
    }

    // Create order record (idempotency key: stripe_session_id)
    await db.from('medallion_orders').insert({
      user_id: userId,
      medallion_code_id: codeId || null,
      shipping_address: shippingJson || JSON.stringify(session.customer_details?.address) || 'Unbekannt',
      memorial_id: memorialId || null,
      product_id: productId || null,
      status: codeId ? 'processing' : 'pending_stock',
      stripe_session_id: session_id,
    });
  }

  // 4. Unlock purchase
  const isUnlock = sessionType === 'unlock' || session.metadata?.unlock === 'true';
  if (isUnlock && memorialId) {
    await db.from('memorial_pages').update({ is_live: true }).eq('id', memorialId).eq('user_id', userId);
    console.log(`[Fulfill] Memorial ${memorialId} unlocked.`);
  }

  // 5. Redirect to success destination
  redirect(memorialId ? `/dashboard/edit/${memorialId}?success=medallion` : '/dashboard?success=medallion');
}
