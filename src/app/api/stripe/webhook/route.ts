import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/utils/supabase/admin';
import { sendStockAlertEmail } from '@/utils/resend';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  apiVersion: '2023-10-16' as any,
});

export async function POST(req: NextRequest) {
  const payload = await req.text();
  const signature = req.headers.get('Stripe-Signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    // Requires STRIPE_WEBHOOK_SECRET to be present in .env
    event = stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (err: unknown) {
    const error = err as Error;
    console.error(`[Webhook Error] Verify failed:`, error.message);
    return NextResponse.json({ error: `Webhook Error: ${error.message}` }, { status: 400 });
  }

  try {
    // -------------------------------------------------------------
    // Core Workflow: Stripe Session Completion Triage
    // -------------------------------------------------------------
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutSessionCompleted(session);
    }

    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    const error = err as Error;
    console.error(`[Webhook Logic Error]:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  // Expand line items to determine the specific products purchased
  const expandedSession = await stripe.checkout.sessions.retrieve(session.id, {
    expand: ['line_items']
  });

  const lineItems = expandedSession.line_items?.data || [];
  
  const isMedallionPurchase = lineItems.some(item => item.price?.id === process.env.STRIPE_PRICE_MEDALLION);
  const isUnlockPurchase = lineItems.some(item => item.price?.id === process.env.STRIPE_PRICE_UNLOCK);

  const supabaseAdmin = createAdminClient();
  const memorialId = session.metadata?.memorial_id;
  const userId = session.client_reference_id; 

  if (!userId) {
    throw new Error("Missing Auth UID (client_reference_id) from session payload");
  }

  // -----------------------------------------------------------------
  // 1. One-Time Medallion Fulfillment Engine
  // -----------------------------------------------------------------
  if (isMedallionPurchase && memorialId) {
    
    // a. Fetch Oldest Available "Stocked" Token
    const { data: codeData, error: codeErr } = await supabaseAdmin
      .from('medallion_codes')
      .select('id, code')
      .eq('status', 'available')
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (codeErr || !codeData) {
      await sendStockAlertEmail(0);
      throw new Error("CRITICAL: Out of Medallion Stock. Payment collected, assignment failed.");
    }

    // b. Alert Admin if Stock touches warning bounds
    const { count: stockCount } = await supabaseAdmin
      .from('medallion_codes')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'available');

    const threshold = parseInt(process.env.MEDALLION_STOCK_ALERT || '10', 10);
    if (stockCount && (stockCount - 1) <= threshold) {
      await sendStockAlertEmail(stockCount - 1);
    }

    // c. Log internal order ledger mapping shipping logic
    const { data: orderData, error: orderErr } = await supabaseAdmin
      .from('medallion_orders')
      .insert({
        user_id: userId,
        // @ts-expect-error - Stripe Checkout Session shipping_details typing shifts with apiVersions
        shipping_address: JSON.stringify(session.shipping_details || session.customer_details?.address) || 'Unknown',
        stripe_session_id: session.id,
      })
      .select('id')
      .single();

    if (orderErr) throw new Error(`Failed generating log entry: ${orderErr.message}`);

    // d. Finalize Medallion Code Transition globally
    const { error: assignErr } = await supabaseAdmin
      .from('medallion_codes')
      .update({
        status: 'assigned',
        memorial_id: memorialId,
        order_id: orderData.id,
        assigned_at: new Date().toISOString()
      })
      .eq('id', codeData.id);

    if (assignErr) throw new Error(`Code transition fail: ${assignErr.message}`);
    console.log(`[Webhook Auto-Fulfillment] Assigned Code: ${codeData.code}`);
  }

  // -----------------------------------------------------------------
  // 2. Virtual Memorial Unlock Activation Engine
  // -----------------------------------------------------------------
  if (isUnlockPurchase && memorialId) {
    const { error } = await supabaseAdmin
      .from('memorial_pages')
      .update({ is_live: true })
      .eq('id', memorialId)
      .eq('user_id', userId);

    if (error) throw new Error(`Unlock fail: ${error.message}`);
    console.log(`[Webhook Activation] Live Unlocked: Memorial ${memorialId}`);
  }
}
