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

    // Fetch dynamic unlock price from DB
    const { data: setting, error: settingsError } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'unlock_price')
      .single();

    if (settingsError && settingsError.code !== 'PGRST116') {
      console.error('Error fetching unlock_price:', settingsError);
    }
    
    // Default fallback if DB is empty: 49 CHF
    const unlockPrice = setting?.value || { amount: 4900, currency: 'chf', name: 'Gedenkseite Freischaltung' };

    // Determine the host for redirect URLs
    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'https://memorize-liart.vercel.app';

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'twint'], // 'twint' requires activation in Stripe dashboard for CH
      line_items: [
        {
          price_data: {
            currency: unlockPrice.currency,
            product_data: {
              name: unlockPrice.name,
            },
            unit_amount: unlockPrice.amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/dashboard/edit/${memorial_id}?success=true`,
      cancel_url: `${origin}/dashboard/edit/${memorial_id}?canceled=true`,
      client_reference_id: user.id, // Picked up by webhook
      metadata: {
        memorial_id: memorial_id, // Picked up by webhook to unlock page
        unlock: 'true',
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Stripe Checkout Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
