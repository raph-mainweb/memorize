/**
 * POST /api/shopify/webhook/products
 *
 * Shopify Webhook Handler — automatischer WP-Sync bei Produktänderungen.
 *
 * Wird von Shopify aufgerufen wenn:
 *  - Ein Produkt erstellt wird     (products/create)
 *  - Ein Produkt aktualisiert wird (products/update)
 *  - Ein Produkt gelöscht wird     (products/delete — wird geloggt, kein WP-Delete)
 *
 * Setup in Shopify Admin:
 *  Settings → Notifications → Webhooks → Create webhook
 *  Topic: Product update / Product create
 *  URL:   https://memorize-liart.vercel.app/api/shopify/webhook/products
 *  Format: JSON
 *
 * Security: HMAC-SHA256 Signatur via X-Shopify-Hmac-Sha256 Header
 * (gleiche Secret wie Shopify App Credentials)
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { syncProductsToWordPress } from '@/lib/wordpress/sync';

const SHOPIFY_WEBHOOK_SECRET = process.env.SHOPIFY_CLIENT_SECRET || '';

export async function POST(req: NextRequest) {
  // ── Verify HMAC signature ─────────────────────────────────────────────────
  const rawBody = await req.text();
  const hmacHeader = req.headers.get('x-shopify-hmac-sha256') || '';
  const topic = req.headers.get('x-shopify-topic') || 'unknown';
  const shopDomain = req.headers.get('x-shopify-shop-domain') || '';

  if (SHOPIFY_WEBHOOK_SECRET) {
    const computedHmac = crypto
      .createHmac('sha256', SHOPIFY_WEBHOOK_SECRET)
      .update(rawBody, 'utf8')
      .digest('base64');

    if (computedHmac !== hmacHeader) {
      console.warn(`[Shopify Webhook] Invalid HMAC from ${shopDomain}`);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  console.log(`[Shopify Webhook] Received topic=${topic} from ${shopDomain}`);

  // ── Handle product events ─────────────────────────────────────────────────
  if (topic === 'products/delete') {
    // We log deletes but do NOT auto-delete WP posts to avoid accidental removal
    console.log(`[Shopify Webhook] Product deleted — manual WP cleanup required if needed`);
    return NextResponse.json({ ok: true, action: 'logged_delete' });
  }

  // products/create or products/update → trigger full sync
  // (Full sync is safe: it upserts by slug, nothing gets deleted)
  if (topic === 'products/create' || topic === 'products/update') {
    console.log(`[Shopify Webhook] Triggering WP sync for topic=${topic}…`);

    // Run sync in background — return 200 immediately so Shopify doesn't retry
    // Shopify expects a response within 5 seconds
    syncProductsToWordPress()
      .then((result) => {
        console.log(`[Shopify Webhook] Sync complete — created: ${result.created.length}, updated: ${result.updated.length}, errors: ${result.errors.length}`);
      })
      .catch((err) => {
        console.error('[Shopify Webhook] Sync failed:', err instanceof Error ? err.message : String(err));
      });

    return NextResponse.json({ ok: true, action: 'sync_triggered', topic });
  }

  // Any other topic — acknowledge and ignore
  return NextResponse.json({ ok: true, action: 'ignored', topic });
}
