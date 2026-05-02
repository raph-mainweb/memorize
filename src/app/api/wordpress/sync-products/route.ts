/**
 * POST /api/wordpress/sync-products
 *
 * Triggers a one-way sync of all Shopify products → WordPress ACF CPT.
 * Protected by a shared secret header to prevent unauthorized triggers.
 *
 * Header required: x-sync-secret: <SYNC_SECRET env var>
 *
 * Can be called:
 *  - Manually via curl / Postman for on-demand sync
 *  - From a GitHub Actions cron job or Vercel cron
 *  - From the Admin dashboard (future)
 *
 * Example:
 *   curl -X POST https://your-app.vercel.app/api/wordpress/sync-products \
 *     -H "x-sync-secret: your_secret_here"
 */

import { NextRequest, NextResponse } from 'next/server';
import { syncProductsToWordPress } from '@/lib/wordpress/sync';

const SYNC_SECRET = process.env.SYNC_SECRET || '';

export async function POST(req: NextRequest) {
  // ── Auth check ─────────────────────────────────────────────────────────────
  // Skip auth check if SYNC_SECRET is not set (dev/testing convenience)
  if (SYNC_SECRET) {
    const secret = req.headers.get('x-sync-secret');
    if (secret !== SYNC_SECRET) {
      console.warn('[Sync API] Unauthorized attempt — invalid x-sync-secret');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  } else {
    console.warn('[Sync API] SYNC_SECRET not set — running unprotected (dev mode)');
  }

  // ── Run sync ───────────────────────────────────────────────────────────────
  console.log('[Sync API] Starting product sync...');
  const startedAt = Date.now();

  try {
    const result = await syncProductsToWordPress();
    const durationMs = Date.now() - startedAt;

    return NextResponse.json({
      ok: true,
      durationMs,
      summary: {
        totalShopify: result.totalShopify,
        totalWp: result.totalWp,
        created: result.created.length,
        updated: result.updated.length,
        errors: result.errors.length,
      },
      details: {
        created: result.created,
        updated: result.updated,
        skipped: result.skipped,
        errors: result.errors,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Sync API] Unexpected error:', msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

// Block GET requests with a helpful message
export async function GET() {
  return NextResponse.json(
    { error: 'Use POST with x-sync-secret header to trigger sync.' },
    { status: 405 }
  );
}
