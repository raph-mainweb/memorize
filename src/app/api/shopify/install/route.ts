/**
 * Shopify OAuth Install Route
 * GET /api/shopify/install?secret={SHOPIFY_INSTALL_SECRET}
 *
 * Internal-only route. Triggers the Shopify OAuth Authorization Code Flow.
 * Visit this URL once as admin to connect the Shopify app to the store.
 *
 * Access is protected by SHOPIFY_INSTALL_SECRET env var.
 * After redirect: Shopify → /api/shopify/callback → token saved to DB.
 *
 * This route is safe to leave deployed. Without the secret, nobody can trigger it.
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const SHOPIFY_CLIENT_ID = process.env.SHOPIFY_CLIENT_ID!;
const SHOPIFY_SHOP_DOMAIN = process.env.SHOPIFY_SHOP_DOMAIN!;
const INSTALL_SECRET = process.env.SHOPIFY_INSTALL_SECRET || '';

// Admin API scopes required by this app
// Extend this list when adding more Shopify features (e.g. write_orders)
const REQUIRED_SCOPES = 'read_products';

export async function GET(req: NextRequest) {
  // ── Security Gate ─────────────────────────────────────────────────────────
  const { searchParams } = new URL(req.url);
  const requestSecret = searchParams.get('secret');

  if (!INSTALL_SECRET) {
    // No secret configured → block entirely to prevent accidental installs
    return new NextResponse(
      'SHOPIFY_INSTALL_SECRET env var is not set. Configure it before triggering the install flow.',
      { status: 403 }
    );
  }

  if (requestSecret !== INSTALL_SECRET) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  // ── Validate Configuration ───────────────────────────────────────────────
  if (!SHOPIFY_CLIENT_ID || !SHOPIFY_SHOP_DOMAIN) {
    return NextResponse.json(
      { error: 'Missing SHOPIFY_CLIENT_ID or SHOPIFY_SHOP_DOMAIN env vars.' },
      { status: 500 }
    );
  }

  // ── Generate State Nonce (CSRF protection) ────────────────────────────────
  const state = crypto.randomBytes(16).toString('hex');

  // ── Determine Redirect URI ────────────────────────────────────────────────
  // Must match exactly what's registered in Shopify Partner Dashboard → App URLs
  const origin =
    process.env.NEXT_PUBLIC_APP_URL ||
    `https://${req.headers.get('host')}`;
  const redirectUri = `${origin}/api/shopify/callback`;

  // ── Build Shopify OAuth Authorization URL ─────────────────────────────────
  const installUrl = new URL(`https://${SHOPIFY_SHOP_DOMAIN}/admin/oauth/authorize`);
  installUrl.searchParams.set('client_id', SHOPIFY_CLIENT_ID);
  installUrl.searchParams.set('scope', REQUIRED_SCOPES);
  installUrl.searchParams.set('redirect_uri', redirectUri);
  installUrl.searchParams.set('state', state);

  console.log(`[Shopify Install] Redirecting to OAuth for shop: ${SHOPIFY_SHOP_DOMAIN}`);
  console.log(`[Shopify Install] Redirect URI: ${redirectUri}`);

  // ── Store State in Secure Cookie (15 min TTL) ─────────────────────────────
  const response = NextResponse.redirect(installUrl.toString());
  response.cookies.set('shopify_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 15,
    path: '/',
  });

  return response;
}
