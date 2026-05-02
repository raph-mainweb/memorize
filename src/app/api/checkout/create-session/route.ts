/**
 * POST /api/checkout/create-session
 *
 * Unified Stripe Checkout Session Creator — Customer Journey v3.
 *
 * Supports all flows:
 *   flow=A  — Seite freischalten (Draft → LIVE), kein Medaillon
 *   flow=B1 — Medaillon kaufen + Seite freischalten (für mich)
 *   flow=B2 — Medaillon kaufen als Geschenk (Aktivierungstoken, kein User erforderlich)
 *   flow=C  — Bestehende Draft-Seite freischalten
 *   flow=E  — Medaillon zu bestehender LIVE-Seite hinzufügen (nur QR-Guthaben)
 *
 * Request body (JSON):
 * {
 *   flow:              "A" | "B1" | "B2" | "C" | "E"
 *   page_id?:          string  — memorial page UUID (required for A, C, E)
 *   shopify_product_id?: string — required for B1, B2, E (medallion product)
 *   shopify_handle?:   string
 *   shopify_variant_id?: string
 *   gift?:             boolean  — for B2
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  apiVersion: '2023-10-16' as any,
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://memorize-liart.vercel.app';
const WP_URL = (process.env.WP_URL || '').replace(/\/$/, '');

// Unlock price in Rappen (CHF cents) — fetched from DB, fallback 4900 = CHF 49.–
const DEFAULT_UNLOCK_PRICE = 4900;

type Flow = 'A' | 'B1' | 'B2' | 'C' | 'E';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      flow: Flow;
      page_id?: string;
      shopify_product_id?: string;
      shopify_handle?: string;
      shopify_variant_id?: string;
      gift?: boolean;
    };

    const { flow, page_id, shopify_product_id, shopify_handle } = body;

    // ── Auth (required for A, B1, C, E — optional for B2) ─────────────────
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const requiresAuth = flow !== 'B2';
    if (requiresAuth && !user) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    // ── Ownership check for page-related flows ────────────────────────────
    if (page_id && user && ['A', 'C', 'E'].includes(flow)) {
      const db = createAdminClient();
      const { data: page } = await db
        .from('memorial_pages')
        .select('user_id, is_live')
        .eq('id', page_id)
        .single();

      if (!page || page.user_id !== user.id) {
        return NextResponse.json({ error: 'Seite nicht gefunden oder kein Zugriff' }, { status: 403 });
      }

      // Flow E requires page to already be LIVE
      if (flow === 'E' && !page.is_live) {
        return NextResponse.json({ error: 'Seite muss bereits live sein für Flow E' }, { status: 400 });
      }
    }

    // ── Fetch unlock price from DB ─────────────────────────────────────────
    const db = createAdminClient();
    const { data: setting } = await db
      .from('system_settings')
      .select('value')
      .eq('key', 'unlock_price')
      .single();
    const unlockPriceCents: number = setting?.value?.amount ?? DEFAULT_UNLOCK_PRICE;

    // ── Build Stripe line items per flow ──────────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lineItems: any[] = [];

    const needsMedaillon = ['B1', 'B2', 'E'].includes(flow);
    const needsUnlock = ['A', 'B1', 'B2', 'C'].includes(flow);

    // Line Item 1: Medaillon (from Shopify price data in metadata)
    // We use price_data since Shopify prices aren't stored as Stripe Price objects
    if (needsMedaillon) {
      if (!shopify_product_id) {
        return NextResponse.json({ error: 'shopify_product_id fehlt' }, { status: 400 });
      }
      // Fetch price from Shopify
      const { getAppProductById } = await import('@/lib/shopify/products');
      const product = await getAppProductById(shopify_product_id);
      if (!product) {
        return NextResponse.json({ error: 'Shopify Produkt nicht gefunden' }, { status: 404 });
      }
      lineItems.push({
        price_data: {
          currency: 'chf',
          product_data: { name: product.title },
          unit_amount: product.price, // already in Rappen
        },
        quantity: 1,
      });
    }

    // Line Item 2: Seiten-Aktivierung (fix price from DB)
    if (needsUnlock) {
      lineItems.push({
        price_data: {
          currency: 'chf',
          product_data: { name: 'Gedenkseite Freischaltung' },
          unit_amount: unlockPriceCents,
        },
        quantity: 1,
      });
    }

    // ── Build success/cancel URLs per flow ────────────────────────────────
    let successUrl: string;
    let cancelUrl: string;

    switch (flow) {
      case 'A':
      case 'C':
        successUrl = page_id
          ? `${APP_URL}/dashboard/edit/${page_id}?success=true&flow=${flow}`
          : `${APP_URL}/dashboard?success=true`;
        cancelUrl = page_id
          ? `${APP_URL}/dashboard/edit/${page_id}?canceled=true`
          : `${APP_URL}/dashboard`;
        break;
      case 'B1':
        successUrl = `${APP_URL}/dashboard?success=true&flow=B1`;
        cancelUrl = WP_URL ? `${WP_URL}/produkte` : `${APP_URL}/dashboard`;
        break;
      case 'B2':
        successUrl = `${APP_URL}/checkout/gift-success?flow=B2`;
        cancelUrl = WP_URL ? `${WP_URL}/produkte` : `${APP_URL}`;
        break;
      case 'E':
        successUrl = `${APP_URL}/dashboard?success=true&flow=E`;
        cancelUrl = page_id
          ? `${APP_URL}/dashboard/edit/${page_id}`
          : `${APP_URL}/dashboard`;
        break;
      default:
        return NextResponse.json({ error: 'Ungültiger flow' }, { status: 400 });
    }

    // ── Create Stripe Session ─────────────────────────────────────────────
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      customer_email: user?.email ?? undefined,
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: user?.id ?? 'guest',
      metadata: {
        flow,
        page_id: page_id || '',
        shopify_product_id: shopify_product_id || '',
        shopify_handle: shopify_handle || '',
        gift: body.gift ? 'true' : 'false',
        user_email: user?.email || '',
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[create-session] Error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
