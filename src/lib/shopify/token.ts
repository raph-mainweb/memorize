/**
 * Shopify Access Token Manager
 *
 * Manages retrieval and caching of the Shopify Admin API access token.
 * Token is obtained via OAuth Authorization Code Flow (see /api/shopify/install).
 * Stored in Supabase `shopify_config` table (admin-only access, RLS blocks public).
 *
 * Priority order:
 *   1. SHOPIFY_ACCESS_TOKEN env var (fastest — optional manual override)
 *   2. In-memory cache (avoids DB round-trip on repeated calls)
 *   3. Supabase `shopify_config` table (source of truth after OAuth install)
 *
 * Server-side only. Never import from Client Components.
 */

import { createAdminClient } from '@/utils/supabase/admin';

const SHOPIFY_DOMAIN = process.env.SHOPIFY_SHOP_DOMAIN!;

// In-memory cache — scoped to serverless function instance lifetime
let _cachedToken: string | null = null;
let _cacheExpiry = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Returns the Shopify Admin API access token.
 * Throws if no token is configured (OAuth install not yet completed).
 */
export async function getShopifyAccessToken(): Promise<string> {
  // 1. Manual env var override (e.g. shpat_ token from Custom App)
  if (process.env.SHOPIFY_ACCESS_TOKEN) {
    return process.env.SHOPIFY_ACCESS_TOKEN;
  }

  // 2. In-memory cache
  const now = Date.now();
  if (_cachedToken && now < _cacheExpiry) {
    return _cachedToken;
  }

  // 3. Load from Supabase (admin client bypasses RLS)
  const db = createAdminClient();
  const { data, error } = await db
    .from('shopify_config')
    .select('access_token')
    .eq('shop_domain', SHOPIFY_DOMAIN)
    .single();

  if (error || !data?.access_token) {
    throw new Error(
      '[Shopify] No access token found. ' +
      'Complete the OAuth install flow first: visit /api/shopify/install as an admin.'
    );
  }

  // Populate cache
  _cachedToken = data.access_token;
  _cacheExpiry = now + CACHE_TTL_MS;

  return _cachedToken!; // non-null: assigned from data.access_token above
}

/**
 * Invalidates the in-memory token cache.
 * Call after re-installing the app (OAuth callback) to pick up the new token.
 */
export function invalidateTokenCache(): void {
  _cachedToken = null;
  _cacheExpiry = 0;
}

/**
 * Returns true if a token is available (either via env var or DB).
 * Does NOT throw. Use for status checks.
 */
export async function isShopifyConnected(): Promise<boolean> {
  try {
    await getShopifyAccessToken();
    return true;
  } catch {
    return false;
  }
}
