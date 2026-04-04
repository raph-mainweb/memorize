import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/utils/supabase/server';

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
    const { memorial_id } = body;

    if (!memorial_id) {
      return NextResponse.json({ error: 'Memorial ID fehlt' }, { status: 400 });
    }

    const priceId = process.env.STRIPE_PRICE_UNLOCK;
    if (!priceId) {
      console.error('Missing STRIPE_PRICE_UNLOCK in environment variables');
      return NextResponse.json({ error: 'Stripe Konfiguration fehlerhaft' }, { status: 500 });
    }

    // Determine the host for redirect URLs
    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'https://nachklang.ch';

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'twint'], // 'twint' requires activation in Stripe dashboard for CH
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/dashboard/edit/${memorial_id}?success=true`,
      cancel_url: `${origin}/dashboard/edit/${memorial_id}?canceled=true`,
      client_reference_id: user.id, // Picked up by webhook
      metadata: {
        memorial_id: memorial_id, // Picked up by webhook to unlock page
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: Omit<Error, "name"> & { message: string }) {
    console.error('Stripe Checkout Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
