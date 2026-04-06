/**
 * Shopify Admin GraphQL Client
 *
 * Authentication: X-Shopify-Access-Token
 * Token source: lib/shopify/token.ts (env var > in-memory cache > Supabase DB)
 * The token is obtained via OAuth Authorization Code Flow — see /api/shopify/install
 *
 * This file is the ONLY place that makes Shopify API calls.
 * All Shopify interactions are server-side only. Never import from Client Components.
 */

import { getShopifyAccessToken } from './token';

const SHOPIFY_DOMAIN = process.env.SHOPIFY_SHOP_DOMAIN!;
const SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION || '2026-04';
const SHOPIFY_GRAPHQL_URL = `https://${SHOPIFY_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`;

if (!SHOPIFY_DOMAIN) {
  console.warn('[Shopify] Missing SHOPIFY_SHOP_DOMAIN env var.');
}

export interface ShopifyFetchOptions {
  query: string;
  variables?: Record<string, unknown>;
  /** Next.js fetch revalidation in seconds. Use false to disable caching. Default: 60s */
  revalidate?: number | false;
}

/**
 * Executes a Shopify Admin GraphQL query server-side.
 *
 * - Resolves the access token via token manager (env > cache > DB)
 * - Throws on network errors, HTTP errors, or GraphQL errors
 * - If Shopify is not yet connected (no token), throws with setup instructions
 */
export async function shopifyFetch<T = unknown>(options: ShopifyFetchOptions): Promise<T> {
  const { query, variables, revalidate = 60 } = options;

  // Resolve token (async — may read from Supabase on first call)
  const accessToken = await getShopifyAccessToken();

  let response: Response;
  try {
    response = await fetch(SHOPIFY_GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken,
      },
      body: JSON.stringify({ query, variables }),
      next: revalidate === false ? { revalidate: 0 } : { revalidate },
    });
  } catch (networkErr) {
    console.error('[Shopify] Network error:', networkErr);
    throw new Error('[Shopify] Network request failed. Check SHOPIFY_SHOP_DOMAIN and connectivity.');
  }

  if (!response.ok) {
    const text = await response.text().catch(() => '(no body)');
    console.error(`[Shopify] HTTP ${response.status}:`, text);
    throw new Error(`[Shopify] HTTP ${response.status} error from Admin API.`);
  }

  const json = await response.json();

  if (json.errors?.length) {
    console.error('[Shopify] GraphQL errors:', JSON.stringify(json.errors, null, 2));
    throw new Error(`[Shopify] GraphQL error: ${json.errors[0]?.message}`);
  }

  return json.data as T;
}
