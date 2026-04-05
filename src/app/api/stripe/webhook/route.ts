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
  
  // Backward compatibility & dynamic price checkout logic
  const isMedallionPurchase = lineItems.some(item => item.price?.id === process.env.STRIPE_PRICE_MEDALLION) || session.metadata?.medallion === 'true';
  const isUnlockPurchase = session.metadata?.unlock === 'true' || lineItems.some(item => item.price?.id === process.env.STRIPE_PRICE_UNLOCK);

  const supabaseAdmin = createAdminClient();
  const memorialId = session.metadata?.memorial_id;
  const userId = session.client_reference_id; 

  if (!userId) {
    throw new Error("Missing Auth UID (client_reference_id) from session payload");
  }

  // -----------------------------------------------------------------
  // 1. One-Time Medallion Fulfillment Engine (New Manual Flow)
  // -----------------------------------------------------------------
  if (isMedallionPurchase) {
    // Only log the order to `medallion_orders`. No automatic stock deduction.
    // Admin handles manual dispatching via Dashboard.
    
    // We assume there's a fallback product ID for legacy, or we rely on session metadata.
    const productId = session.metadata?.product_id || null;
    
    const { error: orderErr } = await supabaseAdmin
      .from('medallion_orders')
      .insert({
        user_id: userId,
        // @ts-expect-error - Stripe Checkout Session shipping_details typing shifts with apiVersions
        shipping_address: JSON.stringify(session.shipping_details || session.customer_details?.address) || 'Unknown',
        stripe_session_id: session.id, // Store session ID for reference if not mapped natively
        ...(productId ? { product_id: productId } : {}), // only set if we have the new products column mapping
        ...(memorialId ? { memorial_id: memorialId } : {}), // save the targeted memorial
        status: 'pending'
      });

    if (orderErr) {
       console.error(`Failed generating log entry for Medallion Order: ${orderErr.message}`);
    } else {
       console.log(`[Webhook Auto-Fulfillment] New Medallion Order Logged for manual dispatch. User: ${userId}`);
    }
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
