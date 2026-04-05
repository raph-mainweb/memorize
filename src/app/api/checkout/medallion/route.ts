import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  apiVersion: '2023-10-16' as any,
});

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });

    const body = await req.json();
    const { product_id, memorial_id, shipping } = body as {
      product_id: string;
      memorial_id?: string;
      shipping?: {
        first_name?: string; last_name?: string;
        address_line1?: string; address_line2?: string;
        postal_code?: string; city?: string; country?: string; phone?: string;
      };
    };

    if (!product_id) return NextResponse.json({ error: 'Product ID fehlt' }, { status: 400 });

    const adminDb = createAdminClient();
    const { data: product, error: productError } = await adminDb
      .from('products')
      .select('id, title, price_in_cents, is_active')
      .eq('id', product_id)
      .eq('is_active', true)
      .single();

    if (productError || !product) return NextResponse.json({ error: 'Produkt nicht gefunden.' }, { status: 404 });

    // Save shipping to profile immediately (before Stripe redirect)
    // Webhook also saves it as fallback, but this is the primary save
    if (shipping && user) {
      await adminDb.from('profiles').update({
        first_name: shipping.first_name || null,
        last_name: shipping.last_name || null,
        address_line1: shipping.address_line1 || null,
        address_line2: shipping.address_line2 || null,
        postal_code: shipping.postal_code || null,
        city: shipping.city || null,
        country: shipping.country || null,
        phone: shipping.phone || null,
      }).eq('id', user.id);
    }

    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'https://memorize-liart.vercel.app';

    // Stripe metadata: max 500 chars per value
    // Store shipping as JSON for webhook to reference
    const shippingJson = shipping ? JSON.stringify(shipping) : '';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'twint'],
      line_items: [{
        price_data: {
          currency: 'chf',
          product_data: { name: `Medaillon: ${product.title}` },
          unit_amount: product.price_in_cents,
        },
        quantity: 1,
      }],
      mode: 'payment',
      customer_email: user.email ?? undefined,
      // Route through /checkout/fulfill so the server can assign the medallion
      // immediately on return — no webhook dependency
      // {CHECKOUT_SESSION_ID} is a Stripe template variable replaced automatically
      success_url: memorial_id
        ? `${origin}/checkout/fulfill?session_id={CHECKOUT_SESSION_ID}&memorial_id=${memorial_id}`
        : `${origin}/checkout/fulfill?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/medaillons?canceled=true`,
      client_reference_id: user.id,
      metadata: {
        type: 'medallion',         // ← key for webhook detection
        product_id: product_id,
        ...(memorial_id ? { memorial_id } : {}),
        ...(shippingJson.length <= 490 ? { shipping_json: shippingJson } : {}),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Medallion Checkout Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
