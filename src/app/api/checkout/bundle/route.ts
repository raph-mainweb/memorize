import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/utils/supabase/server';
import { getAppProductById } from '@/lib/shopify/products';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  apiVersion: '2023-10-16' as any,
});

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const body = await req.json();
    const { memorial_id, shopify_product_id } = body;

    if (!memorial_id || !shopify_product_id) {
      return NextResponse.json({ error: 'memorial_id und shopify_product_id erforderlich' }, { status: 400 });
    }

    // Fetch product from Shopify — gets correct price and title
    const product = await getAppProductById(shopify_product_id);

    if (!product) {
      return NextResponse.json({ error: 'Produkt nicht gefunden' }, { status: 404 });
    }

    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'https://memorize-liart.vercel.app';

    // Shopify price IS the total (page unlock + medallion combined)
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'twint'],
      line_items: [
        {
          price_data: {
            currency: 'chf',
            product_data: { name: `Nachklang: ${product.title}` },
            unit_amount: product.price, // z.B. 5200 = CHF 52.–
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      customer_email: user.email ?? undefined,
      success_url: `${origin}/dashboard/edit/${memorial_id}?success=true`,
      cancel_url: `${origin}/dashboard?canceled=true`,
      client_reference_id: user.id,
      metadata: {
        memorial_id,
        unlock: 'true',
        type: 'bundle',
        shopify_product_id,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Bundle Checkout Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
