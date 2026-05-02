/**
 * Shopify Product Service
 *
 * Handles all product data fetching from Shopify Admin GraphQL API.
 * Maps raw Shopify data to the internal AppProduct format.
 * Filters by NACHKLANG_TAG — only tagged products appear in the app.
 *
 * Server-side only. Never import from client components.
 */

import { shopifyFetch } from './client';
import type { ShopifyProductRaw, ShopifyVariantRaw, AppProduct, AppVariant } from './types';

/**
 * Tag that marks products for use in this app.
 * Change the env var SHOPIFY_PRODUCT_TAG to filter by a different tag.
 * Never hardcode the tag value outside this constant.
 */
const NACHKLANG_TAG = process.env.SHOPIFY_PRODUCT_TAG || 'nachklang-app';

// ── GraphQL ────────────────────────────────────────────────────────────────────

const PRODUCT_FIELDS = `
  id
  title
  handle
  descriptionHtml
  productType
  status
  tags
  images(first: 10) {
    edges {
      node {
        url
        altText
      }
    }
  }
  variants(first: 20) {
    edges {
      node {
        id
        title
        price
        compareAtPrice
        availableForSale
      }
    }
  }
  metafields(first: 20) {
    edges {
      node {
        key
        namespace
        value
      }
    }
  }
`;

const GET_PRODUCTS_QUERY = `
  query GetNachklangProducts($query: String!) {
    products(first: 50, query: $query) {
      edges {
        node {
          ${PRODUCT_FIELDS}
        }
      }
    }
  }
`;

const GET_PRODUCT_BY_HANDLE_QUERY = `
  query GetProductByHandle($handle: String!) {
    productByHandle(handle: $handle) {
      ${PRODUCT_FIELDS}
    }
  }
`;

// ── Mapping Helpers ─────────────────────────────────────────────────────────────

/** Extracts numeric ID from Shopify GID: "gid://shopify/Product/123" → "123" */
function extractNumericId(gid: string): string {
  return gid.split('/').pop() || gid;
}

/** Converts Shopify price string "149.00" to Rappen (CHF cents): 14900 */
function chfToRappen(amount: string | null | undefined): number {
  if (!amount) return 0;
  const parsed = parseFloat(amount);
  return isNaN(parsed) ? 0 : Math.round(parsed * 100);
}

/** Strips HTML tags and entities from a string */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function mapVariant(raw: ShopifyVariantRaw): AppVariant {
  return {
    id: raw.id,
    shopifyVariantId: extractNumericId(raw.id),
    title: raw.title,
    price: chfToRappen(raw.price),
    compareAtPrice: raw.compareAtPrice ? chfToRappen(raw.compareAtPrice) : null,
    available: raw.availableForSale,
    requiresShipping: true, // physical medallion products always require shipping
  };
}

function mapProduct(raw: ShopifyProductRaw): AppProduct {
  const variants = raw.variants.edges.map((e) => mapVariant(e.node));
  const firstVariant = variants[0];
  const images = raw.images.edges.map((e) => e.node);

  // Parse metafields from edges→node connection (filter by namespace+key in code)
  const metafieldNodes = (raw.metafields?.edges || []).map((e) => e.node).filter(Boolean);
  const shortDescMeta = metafieldNodes.find((m) => m?.namespace === 'nachklang' && m?.key === 'short_description')
    || metafieldNodes.find((m) => m?.namespace === 'my_fields' && m?.key === 'kurzbeschreibung_text');
  const badgeMeta = metafieldNodes.find((m) => m?.namespace === 'custom' && m?.key === 'card_badge');
  const iconText1Meta = metafieldNodes.find((m) => m?.namespace === 'my_fields' && m?.key === 'icon_text1');
  const iconText2Meta = metafieldNodes.find((m) => m?.namespace === 'my_fields' && m?.key === 'icon_text2');
  const iconText3Meta = metafieldNodes.find((m) => m?.namespace === 'my_fields' && m?.key === 'icon_text3');
  const uspMeta = metafieldNodes.find((m) => m?.namespace === 'nachklang' && m?.key === 'usp');

  let uspItems: string[] = [];
  try {
    if (uspMeta?.value) {
      const parsed = JSON.parse(uspMeta.value);
      if (Array.isArray(parsed)) uspItems = parsed;
    }
  } catch {
    // Ignore malformed metafield
  }

  return {
    id: raw.id,
    shopifyProductId: extractNumericId(raw.id),
    handle: raw.handle,
    title: raw.title,
    description: raw.descriptionHtml || '',
    descriptionText: stripHtml(raw.descriptionHtml || ''),
    shortDescription: shortDescMeta?.value || null,
    badge: badgeMeta?.value || null,
    iconText1: iconText1Meta?.value || null,
    iconText2: iconText2Meta?.value || null,
    iconText3: iconText3Meta?.value || null,
    uspItems,
    price: firstVariant?.price ?? 0,
    compareAtPrice: firstVariant?.compareAtPrice ?? null,
    images,
    tags: raw.tags || [],
    variants,
    productType: raw.productType || '',
    requiresShipping: true, // physical medallion products always require shipping
    active: raw.status === 'ACTIVE',
  };
}

// ── Public Service API ──────────────────────────────────────────────────────────

/**
 * Returns all active products tagged with NACHKLANG_TAG from Shopify.
 * Results are cached for 60 seconds (via Next.js fetch cache).
 *
 * Returns empty array on Shopify error (graceful degradation).
 * Server-side only.
 */
export async function getAppProducts(): Promise<AppProduct[]> {
  try {
    const data = await shopifyFetch<{
      products: { edges: { node: ShopifyProductRaw }[] };
    }>({
      query: GET_PRODUCTS_QUERY,
      variables: { query: `tag:${NACHKLANG_TAG} AND status:active` },
      revalidate: 60,
    });

    return data.products.edges
      .map((e) => mapProduct(e.node))
      .filter((p) => p.active && p.tags.includes(NACHKLANG_TAG));
  } catch (err) {
    console.error('[Shopify] getAppProducts failed:', err);
    return [];
  }
}

/**
 * Returns a single active product by Shopify handle.
 * Guards against products that lack the required tag.
 * Returns null if not found, not tagged, or on error.
 *
 * Server-side only.
 */
export async function getAppProductByHandle(handle: string): Promise<AppProduct | null> {
  try {
    const data = await shopifyFetch<{
      productByHandle: ShopifyProductRaw | null;
    }>({
      query: GET_PRODUCT_BY_HANDLE_QUERY,
      variables: { handle },
      revalidate: 60,
    });

    if (!data.productByHandle) return null;

    const product = mapProduct(data.productByHandle);

    if (!product.active) {
      console.warn(`[Shopify] Product "${handle}" is not active.`);
      return null;
    }

    if (!product.tags.includes(NACHKLANG_TAG)) {
      console.warn(`[Shopify] Product "${handle}" found but lacks required tag "${NACHKLANG_TAG}". Access denied.`);
      return null;
    }

    return product;
  } catch (err) {
    console.error(`[Shopify] getAppProductByHandle("${handle}") failed:`, err);
    return null;
  }
}

/**
 * Returns a single active product by its numeric Shopify Product ID.
 * Used by checkout and webhook flows where only the ID is known.
 *
 * Server-side only.
 */
export async function getAppProductById(shopifyProductId: string): Promise<AppProduct | null> {
  try {
    // Shopify Admin API: look up by GID
    const gid = shopifyProductId.startsWith('gid://')
      ? shopifyProductId
      : `gid://shopify/Product/${shopifyProductId}`;

    const GET_BY_ID_QUERY = `
      query GetProductById($id: ID!) {
        product(id: $id) {
          ${PRODUCT_FIELDS}
        }
      }
    `;

    const data = await shopifyFetch<{
      product: ShopifyProductRaw | null;
    }>({
      query: GET_BY_ID_QUERY,
      variables: { id: gid },
      revalidate: 60,
    });

    if (!data.product) return null;

    const product = mapProduct(data.product);

    if (!product.active || !product.tags.includes(NACHKLANG_TAG)) return null;

    return product;
  } catch (err) {
    console.error(`[Shopify] getAppProductById("${shopifyProductId}") failed:`, err);
    return null;
  }
}
