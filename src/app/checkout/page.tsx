/**
 * /checkout — WP Cart → Stripe Checkout (Server Component)
 *
 * Flow:
 *   WordPress Cart "Zur Kasse" → /checkout?cart=<base64>
 *   → Server liest cart-Daten aus URL-Param
 *   → Holt authoritative Preise von Shopify
 *   → Erstellt Stripe Session
 *   → Redirect zu Stripe (kein Zwischen-Screen)
 *
 * Warum URL-Param statt localStorage?
 *   localStorage ist domain-spezifisch. WP (memorize.mainwebsite.ch) und
 *   Next.js (memorize-liart.vercel.app) können localStorage NICHT teilen.
 */

import { redirect } from 'next/navigation';
import Stripe from 'stripe';
import { getAppProductByHandle } from '@/lib/shopify/products';

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
  purchase_label?: string;
}

interface CartPayload {
  cart_id: string;
  items: CartItem[];
}

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: { cart?: string };
}) {
  const cartParam = searchParams.cart;

  // No cart data → back to shop
  if (!cartParam) {
    redirect(WP_SHOP);
  }

  // Decode base64 cart payload
  let payload: CartPayload;
  try {
    const decoded = Buffer.from(decodeURIComponent(cartParam), 'base64').toString('utf-8');
    payload = JSON.parse(decoded);
  } catch {
    redirect(`${WP_SHOP}?checkout_error=invalid_cart`);
  }

  if (!payload.items || payload.items.length === 0) {
    redirect(WP_SHOP);
  }

  // Build Stripe line items — prices from Shopify (not from client)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lineItems: any[] = [];

  for (const item of payload.items) {
    let unitAmount: number;
    let productName = item.title;
    let images: string[] = [];

    if (item.handle) {
      try {
        const shopifyProduct = await getAppProductByHandle(item.handle);
        if (shopifyProduct) {
          unitAmount = shopifyProduct.price; // already in Rappen (CHF cents)
          productName = shopifyProduct.title;
          images = shopifyProduct.images[0]?.url ? [shopifyProduct.images[0].url] : [];
        } else {
          // Fallback: ACF price is stored as CHF decimal (e.g. "149.00") → Rappen
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

  // Create Stripe Checkout Session
  let stripeUrl: string;
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${WP_SHOP}?checkout_canceled=1`,
      metadata: {
        cart_id: payload.cart_id,
        source: 'wp_cart',
        purchase_types: payload.items.map(i => i.purchase_type).join(','),
        handles: payload.items.map(i => i.handle).join(','),
      },
    });

    if (!session.url) throw new Error('Keine Stripe URL erhalten');
    stripeUrl = session.url;
  } catch (err) {
    console.error('[Checkout] Stripe error:', err);
    redirect(`${WP_SHOP}?checkout_error=stripe_failed`);
  }

  // Direct redirect to Stripe — no intermediate page
  redirect(stripeUrl);
}
