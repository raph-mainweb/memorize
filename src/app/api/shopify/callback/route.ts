/**
 * Shopify OAuth Callback Route
 * GET /api/shopify/callback
 *
 * Handles the OAuth callback from Shopify after the user approves the app install.
 * Validates HMAC, state, and shop — then exchanges the code for an access token.
 * Saves the token securely to Supabase `shopify_config` (admin-only, bypasses RLS).
 *
 * Security checks in order:
 *   1. Required parameters present
 *   2. Shop domain matches expected store (prevents cross-store attacks)
 *   3. State matches cookie (CSRF protection)
 *   4. HMAC is valid (Shopify signature verification)
 *   5. Code exchange succeeds
 *   6. Token saved to DB
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAdminClient } from '@/utils/supabase/admin';
import { invalidateTokenCache } from '@/lib/shopify/token';

const SHOPIFY_CLIENT_ID = process.env.SHOPIFY_CLIENT_ID!;
const SHOPIFY_CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET!;
const SHOPIFY_SHOP_DOMAIN = process.env.SHOPIFY_SHOP_DOMAIN!;

/**
 * Validates the HMAC signature from Shopify.
 * Shopify signs OAuth callbacks with HMAC-SHA256 using the app's client secret.
 * All query params except 'hmac' are sorted, joined, then signed.
 */
function validateHmac(searchParams: URLSearchParams, receivedHmac: string): boolean {
  const pairs: string[] = [];
  searchParams.forEach((value, key) => {
    if (key !== 'hmac') {
      // Shopify encodes % as %25 and & as %26 in param values
      pairs.push(`${key}=${value}`);
    }
  });
  pairs.sort();
  const message = pairs.join('&');

  const digest = crypto
    .createHmac('sha256', SHOPIFY_CLIENT_SECRET)
    .update(message)
    .digest('hex');

  // Constant-time comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(digest, 'hex'),
      Buffer.from(receivedHmac, 'hex')
    );
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const code  = searchParams.get('code');
  const shop  = searchParams.get('shop');
  const hmac  = searchParams.get('hmac');
  const state = searchParams.get('state');

  // ── 1. Required params ───────────────────────────────────────────────────
  if (!code || !shop || !hmac || !state) {
    console.error('[Shopify Callback] Missing parameters:', { code: !!code, shop, hmac: !!hmac, state: !!state });
    return NextResponse.json({ error: 'Missing OAuth callback parameters.' }, { status: 400 });
  }

  // ── 2. Shop domain guard ─────────────────────────────────────────────────
  if (shop !== SHOPIFY_SHOP_DOMAIN) {
    console.error(`[Shopify Callback] Shop mismatch: got "${shop}", expected "${SHOPIFY_SHOP_DOMAIN}"`);
    return NextResponse.json({ error: 'Shop domain mismatch.' }, { status: 403 });
  }

  // ── 3. State / CSRF validation ───────────────────────────────────────────
  const cookieState = req.cookies.get('shopify_oauth_state')?.value;
  if (!cookieState || cookieState !== state) {
    console.error('[Shopify Callback] State mismatch — possible CSRF attempt.');
    return NextResponse.json({ error: 'Invalid state parameter.' }, { status: 403 });
  }

  // ── 4. HMAC validation ───────────────────────────────────────────────────
  if (!validateHmac(searchParams, hmac)) {
    console.error('[Shopify Callback] HMAC validation failed.');
    return NextResponse.json({ error: 'Invalid HMAC signature.' }, { status: 403 });
  }

  // ── 5. Exchange code for access token ────────────────────────────────────
  let accessToken: string;
  let grantedScope: string;

  try {
    const tokenRes = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: SHOPIFY_CLIENT_ID,
        client_secret: SHOPIFY_CLIENT_SECRET,
        code,
      }),
    });

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text().catch(() => '(no body)');
      console.error('[Shopify Callback] Token exchange failed:', tokenRes.status, errBody);
      return NextResponse.json(
        { error: 'Token exchange failed.', detail: errBody },
        { status: 400 }
      );
    }

    const tokenData: { access_token?: string; scope?: string } = await tokenRes.json();

    if (!tokenData.access_token) {
      console.error('[Shopify Callback] No access_token in response:', tokenData);
      return NextResponse.json({ error: 'No access token returned by Shopify.' }, { status: 400 });
    }

    accessToken = tokenData.access_token;
    grantedScope = tokenData.scope || '';
    console.log(`[Shopify Callback] Token received. Scope: ${grantedScope}`);
  } catch (err) {
    console.error('[Shopify Callback] Network error during token exchange:', err);
    return NextResponse.json({ error: 'Token exchange network error.' }, { status: 500 });
  }

  // ── 6. Store token in Supabase ───────────────────────────────────────────
  // shopify_config table has RLS enabled — only admin client can write
  const db = createAdminClient();
  const { error: upsertError } = await db.from('shopify_config').upsert(
    {
      shop_domain:  shop,
      access_token: accessToken,
      scope:        grantedScope,
      installed_at: new Date().toISOString(),
      updated_at:   new Date().toISOString(),
    },
    { onConflict: 'shop_domain' }
  );

  if (upsertError) {
    console.error('[Shopify Callback] Failed to save token to DB:', upsertError.message);
    return NextResponse.json({ error: 'Failed to persist access token.' }, { status: 500 });
  }

  // ── 7. Invalidate in-memory cache (picks up new token on next request) ───
  invalidateTokenCache();
  console.log(`[Shopify Callback] ✅ Token saved for ${shop}. Shopify integration is now connected.`);

  // ── 8. Redirect to admin status page + clear state cookie ────────────────
  const origin = process.env.NEXT_PUBLIC_APP_URL || `https://${req.headers.get('host')}`;
  const successResponse = NextResponse.redirect(`${origin}/admin/shopify?connected=true`);
  successResponse.cookies.delete('shopify_oauth_state');

  return successResponse;
}
