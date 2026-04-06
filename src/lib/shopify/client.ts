/**
 * Shopify Admin GraphQL Client
 *
 * Authentication: X-Shopify-Access-Token
 * The SHOPIFY_CLIENT_SECRET env var holds a Private App Admin API access token (shpss_ prefix).
 * This is used directly as a bearer token — no OAuth flow required.
 *
 * This file is the ONLY place in the codebase that reads Shopify credentials.
 * All Shopify API calls must go through `shopifyFetch`. Never expose credentials client-side.
 */

const SHOPIFY_DOMAIN = process.env.SHOPIFY_SHOP_DOMAIN!;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_CLIENT_SECRET!; // shpss_ = Admin API token
const SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION || '2026-04';

const SHOPIFY_GRAPHQL_URL = `https://${SHOPIFY_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`;

if (!SHOPIFY_DOMAIN || !SHOPIFY_ACCESS_TOKEN) {
  console.warn('[Shopify] Missing SHOPIFY_SHOP_DOMAIN or SHOPIFY_CLIENT_SECRET env vars.');
}

interface ShopifyFetchOptions {
  query: string;
  variables?: Record<string, unknown>;
  /** Next.js fetch cache strategy. Default: revalidate every 60s. */
  revalidate?: number | false;
}

/**
 * Executes a Shopify Admin GraphQL query server-side.
 * Throws on HTTP errors or GraphQL errors.
 */
export async function shopifyFetch<T = unknown>(options: ShopifyFetchOptions): Promise<T> {
  const { query, variables, revalidate = 60 } = options;

  let response: Response;
  try {
    response = await fetch(SHOPIFY_GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
      },
      body: JSON.stringify({ query, variables }),
      next: revalidate === false ? { revalidate: 0 } : { revalidate },
    });
  } catch (networkErr) {
    console.error('[Shopify] Network error:', networkErr);
    throw new Error('[Shopify] Network request failed. Check domain and connectivity.');
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
