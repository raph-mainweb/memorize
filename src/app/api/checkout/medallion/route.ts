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

    if (authError || !user) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const body = await req.json();
    const { product_id, memorial_id } = body;

    if (!product_id) {
      return NextResponse.json({ error: 'Product ID fehlt' }, { status: 400 });
    }

    // Fetch product from DB
    const adminDb = createAdminClient();
    const { data: product, error: productError } = await adminDb
      .from('products')
      .select('id, title, price_in_cents, is_active')
      .eq('id', product_id)
      .eq('is_active', true)
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: 'Produkt nicht gefunden oder inaktiv.' }, { status: 404 });
    }

    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'https://memorize-liart.vercel.app';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'twint'],
      line_items: [
        {
          price_data: {
            currency: 'chf',
            product_data: {
              name: `Medaillon: ${product.title}`,
            },
            unit_amount: product.price_in_cents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: memorial_id
        ? `${origin}/dashboard/edit/${memorial_id}?success=medallion`
        : `${origin}/dashboard?success=medallion`,
      cancel_url: `${origin}/medaillons?canceled=true`,
      client_reference_id: user.id,
      metadata: {
        type: 'medallion',
        product_id: product_id,
        ...(memorial_id ? { memorial_id } : {}),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Medallion Checkout Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
