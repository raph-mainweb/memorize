/**
 * POST /api/checkout/from-cart
 *
 * Empfängt WP-Warenkorb + Lieferdaten und erstellt eine Stripe Checkout Session.
 * Preise werden sicher von Shopify geholt (nicht vom Client übernommen).
 * Optional: Supabase User via Magic Link erstellen wenn create_account=true.
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getAppProductByHandle } from '@/lib/shopify/products';
import { createAdminClient } from '@/utils/supabase/admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  apiVersion: '2023-10-16' as any,
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://memorize-liart.vercel.app';
const WP_SHOP = process.env.WP_URL
  ? `${process.env.WP_URL}/shop`
  : 'https://memorize.mainwebsite.ch/shop';

interface CartItem {
  key: string;
  shopify_id: string;
  handle: string;
  title: string;
  image_url?: string;
  price: number;
  quantity: number;
  purchase_type: 'self' | 'gift';
}

interface ShippingAddress {
  name: string;
  email: string;
  phone?: string;
  address: {
    line1: string;
    line2?: string;
    postal_code: string;
    city: string;
    country: string;
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      cart_id,
      items,
      shipping,
      create_account,
      user_id,
    } = body as {
      cart_id: string;
      items: CartItem[];
      shipping: ShippingAddress;
      create_account?: boolean;
      user_id?: string | null;
    };

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Warenkorb ist leer' }, { status: 400 });
    }

    // ── 1. Optional: Create Supabase account via OTP ──────────────────────
    if (create_account && shipping?.email && !user_id) {
      try {
        const adminDb = createAdminClient();
        // Check if user already exists
        const { data: existing } = await adminDb.auth.admin.listUsers();
        const userExists = existing?.users?.some(u => u.email === shipping.email);

        if (!userExists) {
          // Create user + send magic link
          await adminDb.auth.admin.createUser({
            email: shipping.email,
            email_confirm: false, // sends confirmation email
            user_metadata: {
              first_name: shipping.name.split(' ')[0] || '',
              last_name:  shipping.name.split(' ').slice(1).join(' ') || '',
            },
          });

          // Save shipping address to profile
          const { data: newUser } = await adminDb.auth.admin.listUsers();
          const createdUser = newUser?.users?.find(u => u.email === shipping.email);
          if (createdUser) {
            await adminDb.from('profiles').upsert({
              id: createdUser.id,
              first_name:    shipping.name.split(' ')[0] || '',
              last_name:     shipping.name.split(' ').slice(1).join(' ') || '',
              address_line1: shipping.address.line1,
              address_line2: shipping.address.line2 || '',
              postal_code:   shipping.address.postal_code,
              city:          shipping.address.city,
              country:       shipping.address.country,
              phone:         shipping.phone || '',
            });
          }
        }
      } catch (accountErr) {
        // Non-fatal — continue with checkout even if account creation fails
        console.warn('[Checkout] Account creation warning:', accountErr);
      }
    }

    // ── 2. Save shipping address if user is logged in ─────────────────────
    if (user_id && shipping) {
      try {
        const adminDb = createAdminClient();
        await adminDb.from('profiles').upsert({
          id: user_id,
          first_name:    shipping.name.split(' ')[0] || '',
          last_name:     shipping.name.split(' ').slice(1).join(' ') || '',
          address_line1: shipping.address.line1,
          address_line2: shipping.address.line2 || '',
          postal_code:   shipping.address.postal_code,
          city:          shipping.address.city,
          country:       shipping.address.country,
          phone:         shipping.phone || '',
        });
      } catch (profileErr) {
        console.warn('[Checkout] Profile update warning:', profileErr);
      }
    }

    // ── 3. Build Stripe line items (prices from Shopify) ──────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lineItems: any[] = [];

    for (const item of items) {
      let unitAmount: number;
      let productName = item.title;
      let images: string[] = [];

      if (item.handle) {
        try {
          const shopifyProduct = await getAppProductByHandle(item.handle);
          if (shopifyProduct) {
            unitAmount = shopifyProduct.price; // in Rappen (CHF cents)
            productName = shopifyProduct.title;
            images = shopifyProduct.images[0]?.url ? [shopifyProduct.images[0].url] : [];
          } else {
            unitAmount = Math.round(Number(item.price) * 100);
          }
        } catch {
          unitAmount = Math.round(Number(item.price) * 100);
        }
      } else {
        unitAmount = Math.round(Number(item.price) * 100);
      }

      lineItems.push({
        price_data: {
          currency: 'chf',
          product_data: {
            name: productName,
            description: item.purchase_type === 'gift'
              ? 'Als Geschenk — der Empfänger aktiviert das Medaillon'
              : 'Für mich — ich aktiviere das Medaillon selbst',
            ...(images.length > 0 ? { images } : {}),
          },
          unit_amount: unitAmount,
        },
        quantity: Math.max(1, item.quantity),
      });
    }

    // ── 4. Create Stripe Checkout Session ─────────────────────────────────
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      customer_email: shipping?.email || undefined,
      // Prefill shipping in Stripe
      shipping_address_collection: {
        allowed_countries: ['CH', 'DE', 'AT', 'LI'],
      },
      success_url: `${APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${WP_SHOP}?checkout_canceled=1`,
      metadata: {
        cart_id,
        source: 'wp_cart',
        purchase_types: items.map(i => i.purchase_type).join(','),
        handles: items.map(i => i.handle).join(','),
        user_id: user_id || '',
        create_account: create_account ? 'true' : 'false',
      },
    });

    if (!session.url) throw new Error('Keine Stripe URL erhalten');
    return NextResponse.json({ url: session.url });

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unbekannter Fehler';
    console.error('[Checkout from-cart] Error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
