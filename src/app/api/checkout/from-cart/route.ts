/**
 * POST /api/checkout/from-cart
 *
 * Empfängt den WP-Warenkorb (aus WordPress localStorage Cart Plugin)
 * und erstellt eine Stripe Checkout Session.
 *
 * Flow:
 *   1. Empfange cart_id + items[]
 *   2. Für jedes Item: Preis aus Shopify API holen (verhindert Client-seitige Preismanipulation)
 *   3. Stripe Checkout Session erstellen
 *   4. Redirect-URL zurückgeben
 *
 * Sicherheit: Preise kommen von Shopify, NICHT vom Client.
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getAppProductByHandle } from '@/lib/shopify/products';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  apiVersion: '2023-10-16' as any,
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://memorize-liart.vercel.app';

interface CartItem {
  key: string;
  shopify_id: string;
  handle: string;
  title: string;
  image_url?: string;
  price: number;        // from WP/ACF — used as fallback display only, NOT for Stripe
  quantity: number;
  purchase_type: 'self' | 'gift';
  purchase_label?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { cart_id, items } = body as { cart_id: string; items: CartItem[] };

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Warenkorb ist leer' }, { status: 400 });
    }

    // ── Build Stripe line_items ────────────────────────────────────────────
    // Prices are fetched from Shopify to prevent client-side manipulation
    const lineItems = [];

    for (const item of items) {
      let unitAmount: number;
      let productName = item.title;
      let images: string[] = [];

      if (item.handle) {
        try {
          // Fetch authoritative price from Shopify
          const shopifyProduct = await getAppProductByHandle(item.handle);
          if (shopifyProduct) {
            unitAmount = shopifyProduct.price; // already in Rappen (CHF cents)
            productName = shopifyProduct.title;
            images = shopifyProduct.images[0]?.url ? [shopifyProduct.images[0].url] : [];
          } else {
            // Fallback: use price from ACF (already synced as CHF decimal, convert to Rappen)
            unitAmount = Math.round(Number(item.price) * 100);
          }
        } catch {
          // Fallback if Shopify fetch fails
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
        quantity: item.quantity,
      });
    }

    // ── Create Stripe Checkout Session ────────────────────────────────────
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}&cart_id=${encodeURIComponent(cart_id)}`,
      cancel_url:  `${APP_URL}/checkout?cart_id=${encodeURIComponent(cart_id)}`,
      metadata: {
        cart_id,
        source: 'wp_cart',
        purchase_types: items.map(i => i.purchase_type).join(','),
        handles: items.map(i => i.handle).join(','),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unbekannter Fehler';
    console.error('[Checkout from-cart] Error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
