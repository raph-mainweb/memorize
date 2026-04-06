/**
 * Shopify + App Internal Type Definitions
 *
 * ShopifyProduct* = raw shapes from Shopify Admin GraphQL API
 * App*            = internal mapped format used throughout the app
 *
 * Never expose raw Shopify types to the frontend — always return AppProduct.
 */

// ── Raw Shopify Admin API Types ───────────────────────────────────────────────

export interface ShopifyImage {
  url: string;
  altText: string | null;
}

export interface ShopifyVariantRaw {
  id: string;
  title: string;
  price: string;            // "149.00" — Shopify returns prices as decimal strings
  compareAtPrice: string | null;
  availableForSale: boolean;
  // requiresShipping removed — not available on ProductVariant in current API version
}

export interface ShopifyMetafield {
  key: string;
  namespace: string;
  value: string;
}

export interface ShopifyProductRaw {
  id: string;               // GID: "gid://shopify/Product/9876543210"
  title: string;
  handle: string;
  descriptionHtml: string;
  productType: string;
  status: string;           // "ACTIVE" | "DRAFT" | "ARCHIVED"
  tags: string[];
  images: {
    edges: { node: ShopifyImage }[];
  };
  variants: {
    edges: { node: ShopifyVariantRaw }[];
  };
  // metafields returned as connection (edges → node), not flat array
  metafields: {
    edges: { node: ShopifyMetafield | null }[];
  } | null;
}

// ── Internal App Types ─────────────────────────────────────────────────────────

export interface AppVariant {
  /** Shopify GID: "gid://shopify/ProductVariant/123" */
  id: string;
  /** Numeric Shopify Variant ID: "123" */
  shopifyVariantId: string;
  /** Variant title, e.g. "Silber / Gross" */
  title: string;
  /** Price in Rappen (CHF cents). e.g. 14900 = CHF 149.00 */
  price: number;
  /** Original price before discount, or null */
  compareAtPrice: number | null;
  /** Whether the variant has stock */
  available: boolean;
  /** Whether physical shipping is required */
  requiresShipping: boolean;
}

export interface AppProduct {
  /** Shopify GID: "gid://shopify/Product/9876543210" */
  id: string;
  /** Numeric Shopify Product ID: "9876543210" — use in Stripe metadata */
  shopifyProductId: string;
  /** URL-friendly handle used for routing: /medaillons/[handle] */
  handle: string;
  title: string;
  /** Full HTML description from Shopify */
  description: string;
  /** Plaintext version of description */
  descriptionText: string;
  /** Short teaser text — from Shopify metafield nachklang.short_description */
  shortDescription: string | null;
  /** USP bullet points — from Shopify metafield nachklang.usp (JSON string array) */
  uspItems: string[];
  /** Price of first variant in Rappen. Use for display and checkout. */
  price: number;
  /** Original price before discount (first variant), or null */
  compareAtPrice: number | null;
  images: { url: string; altText: string | null }[];
  tags: string[];
  /** All variants. Variant-ready for future multi-variant support. */
  variants: AppVariant[];
  productType: string;
  /** True if any variant requires shipping */
  requiresShipping: boolean;
  /** True if product status is ACTIVE */
  active: boolean;
}
