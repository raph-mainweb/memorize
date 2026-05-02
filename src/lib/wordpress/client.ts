/**
 * WordPress REST API Client
 *
 * Communicates with the WordPress REST API using Application Password
 * authentication. Used for syncing product data from Shopify → WordPress ACF.
 *
 * Server-side only. Never import from client components.
 *
 * Required env vars:
 *   WP_URL           – WordPress base URL, e.g. https://nachklang.ch
 *   WP_USER          – WordPress username (Application Password user)
 *   WP_APP_PASSWORD  – WordPress Application Password (spaces are stripped)
 *   WP_PRODUCT_POST_TYPE – Custom post type slug, e.g. "products"
 */

const WP_URL = (process.env.WP_URL || '').replace(/\/$/, ''); // strip trailing slash
const WP_USER = process.env.WP_USER || '';
const WP_APP_PASSWORD = (process.env.WP_APP_PASSWORD || '').replace(/\s/g, ''); // strip spaces
const WP_PRODUCT_POST_TYPE = process.env.WP_PRODUCT_POST_TYPE || 'products';

if (!WP_URL || !WP_USER || !WP_APP_PASSWORD) {
  console.warn('[WP Client] Missing env vars: WP_URL, WP_USER or WP_APP_PASSWORD');
}

/** Base64-encoded credentials for Basic Auth */
function getAuthHeader(): string {
  const credentials = `${WP_USER}:${WP_APP_PASSWORD}`;
  return 'Basic ' + Buffer.from(credentials).toString('base64');
}

/** The custom post type slug for products */
export const WP_CPT = WP_PRODUCT_POST_TYPE;

// ── Types ───────────────────────────────────────────────────────────────────

export interface WpPost {
  id: number;
  slug: string;
  title: { rendered: string };
  status: string;
  acf?: Record<string, unknown>;
}

export interface WpPostPayload {
  title: string;
  slug: string;
  status: 'publish' | 'draft';
  acf: Record<string, unknown>;
}

// ── Core Fetch ──────────────────────────────────────────────────────────────

/**
 * Authenticated fetch to the WordPress REST API.
 * Throws on non-2xx responses with a detailed error message.
 */
export async function wpFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${WP_URL}/wp-json/wp/v2${path}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: getAuthHeader(),
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`[WP Client] ${res.status} ${res.statusText} — ${url}\n${body}`);
  }

  return res.json() as Promise<T>;
}

// ── Post CRUD ───────────────────────────────────────────────────────────────

/**
 * Lists all posts of the product CPT.
 * Returns up to 100 posts. For larger sites, add pagination.
 */
export async function wpListPosts(): Promise<WpPost[]> {
  return wpFetch<WpPost[]>(`/${WP_CPT}?per_page=100&_fields=id,slug,title,status,acf`);
}

/**
 * Creates a new post in the product CPT.
 */
export async function wpCreatePost(payload: WpPostPayload): Promise<WpPost> {
  return wpFetch<WpPost>(`/${WP_CPT}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Updates an existing post by WP post ID.
 */
export async function wpUpdatePost(postId: number, payload: Partial<WpPostPayload>): Promise<WpPost> {
  return wpFetch<WpPost>(`/${WP_CPT}/${postId}`, {
    method: 'POST', // WP REST API uses POST for updates too (PATCH also works)
    body: JSON.stringify(payload),
  });
}
