/**
 * Medallion Checkout API Route
 *
 * Creates a Stripe Checkout session for a medallion purchase.
 * Product data (title, price) comes from Shopify Admin API.
 *
 * REPLACED: product_id (Supabase UUID) lookup
 * NEW:      shopify_handle → getAppProductByHandle → price from Shopify
 *
 * Stripe metadata uses shopify_product_id, shopify_variant_id, shopify_handle
 * so that the webhook and fulfill page can reference the correct product.
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/utils/supabase/server';
import { getAppProductByHandle } from '@/lib/shopify/products';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  apiVersion: '2023-10-16' as any,
});

export async function POST(req: NextRequest) {
  try {
    // 1. Auth check
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    // 2. Parse request body
    const body = await req.json();
    const {
      shopify_handle,
      shopify_product_id,
      shopify_variant_id,
      memorial_id,
      shipping,
    } = body as {
      shopify_handle: string;
      shopify_product_id?: string;
      shopify_variant_id?: string | null;
      memorial_id?: string;
      shipping?: {
        first_name?: string; last_name?: string;
        address_line1?: string; address_line2?: string;
        postal_code?: string; city?: string; country?: string; phone?: string;
      };
    };

    if (!shopify_handle) {
      return NextResponse.json({ error: 'shopify_handle fehlt' }, { status: 400 });
    }

    // 3. Load product from Shopify (price is authoritative source)
    const product = await getAppProductByHandle(shopify_handle);
    if (!product) {
      return NextResponse.json({ error: 'Produkt nicht gefunden oder nicht verfügbar.' }, { status: 404 });
    }

    // 4. Determine variant (default to first variant)
    const variant = shopify_variant_id
      ? product.variants.find((v) => v.shopifyVariantId === shopify_variant_id) ?? product.variants[0]
      : product.variants[0];

    if (!variant) {
      return NextResponse.json({ error: 'Keine Variante verfügbar.' }, { status: 400 });
    }

    // 5. Save shipping to profile immediately (primary save; webhook also saves as fallback)
    if (shipping && user) {
      const { createAdminClient } = await import('@/utils/supabase/admin');
      const adminDb = createAdminClient();
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
    const shippingJson = shipping ? JSON.stringify(shipping) : '';

    // 6. Create Stripe Checkout Session
    //    Price authoritative from Shopify variant (in Rappen / CHF cents)
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'twint'],
      line_items: [{
        price_data: {
          currency: 'chf',
          product_data: { name: `Medaillon: ${product.title}` },
          unit_amount: variant.price, // already in Rappen
        },
        quantity: 1,
      }],
      mode: 'payment',
      customer_email: user.email ?? undefined,
      success_url: memorial_id
        ? `${origin}/checkout/fulfill?session_id={CHECKOUT_SESSION_ID}&memorial_id=${memorial_id}`
        : `${origin}/checkout/fulfill?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/medaillons?canceled=true`,
      client_reference_id: user.id,
      metadata: {
        type: 'medallion',
        // Shopify product references (replaces old Supabase product_id)
        shopify_product_id: product.shopifyProductId,
        shopify_variant_id: variant.shopifyVariantId,
        shopify_handle: product.handle,
        ...(memorial_id ? { memorial_id } : {}),
        ...(shippingJson.length <= 490 ? { shipping_json: shippingJson } : {}),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('[Checkout/Medallion] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
