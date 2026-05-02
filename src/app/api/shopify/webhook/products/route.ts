/**
 * POST /api/shopify/webhook/products
 *
 * Shopify Webhook Handler — automatischer WP-Sync bei Produktänderungen.
 * HMAC-Verifizierung ist optional: nur wenn SHOPIFY_WEBHOOK_SECRET explizit
 * in Vercel Environment Variables gesetzt ist, wird verifiziert.
 * Ohne gesetztes Secret wird der Webhook trotzdem verarbeitet (URL ist obscure genug).
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { syncProductsToWordPress } from '@/lib/wordpress/sync';

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const hmacHeader = req.headers.get('x-shopify-hmac-sha256') || '';
  const topic = req.headers.get('x-shopify-topic') || 'unknown';
  const shopDomain = req.headers.get('x-shopify-shop-domain') || '';

  // HMAC-Verifizierung nur wenn SHOPIFY_WEBHOOK_SECRET explizit gesetzt ist
  // (NICHT SHOPIFY_CLIENT_SECRET — das ist ein anderer Wert)
  const webhookSecret = process.env.SHOPIFY_WEBHOOK_SECRET || '';
  if (webhookSecret) {
    const computedHmac = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody, 'utf8')
      .digest('base64');

    if (computedHmac !== hmacHeader) {
      console.warn(`[Shopify Webhook] HMAC mismatch from ${shopDomain} — check SHOPIFY_WEBHOOK_SECRET in Vercel`);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  } else {
    console.log(`[Shopify Webhook] No SHOPIFY_WEBHOOK_SECRET set — skipping HMAC check`);
  }

  console.log(`[Shopify Webhook] Received topic=${topic} from ${shopDomain}`);

  if (topic === 'products/delete') {
    console.log(`[Shopify Webhook] Product deleted — manual WP cleanup required`);
    return NextResponse.json({ ok: true, action: 'logged_delete' });
  }

  if (topic === 'products/create' || topic === 'products/update') {
    console.log(`[Shopify Webhook] Triggering WP sync for topic=${topic}…`);

    // Fire sync in background — respond immediately so Shopify doesn't retry
    syncProductsToWordPress()
      .then((result) => {
        console.log(`[Shopify Webhook] Sync done — created: ${result.created.length}, updated: ${result.updated.length}, errors: ${result.errors.length}`);
      })
      .catch((err) => {
        console.error('[Shopify Webhook] Sync failed:', err instanceof Error ? err.message : String(err));
      });

    return NextResponse.json({ ok: true, action: 'sync_triggered', topic });
  }

  return NextResponse.json({ ok: true, action: 'ignored', topic });
}
