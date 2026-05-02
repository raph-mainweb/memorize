/**
 * WordPress Product Sync
 *
 * Reads all active Shopify products tagged for Nachklang and upserts them
 * as WordPress posts in the configured custom post type (CPT) with ACF fields.
 *
 * Sync strategy:
 *   - Match by slug (= Shopify handle). If a WP post exists with that slug → update.
 *   - If no post exists → create.
 *   - WP posts for products no longer in Shopify are NOT deleted automatically
 *     (manual cleanup preferred to avoid accidental data loss).
 *
 * ACF Field Mapping (adjust to match your actual ACF field names in WP):
 *   shopify_product_id   → Shopify numeric ID (for reference)
 *   shopify_handle       → Shopify URL handle
 *   price                → Price in CHF (e.g. 149.00)
 *   compare_at_price     → Original price or null
 *   short_description    → Short teaser text
 *   badge                → Card badge text (e.g. "Bestseller")
 *   icon_text_1          → First icon feature text
 *   icon_text_2          → Second icon feature text
 *   usp_items            → JSON string array of USP bullet points
 *   image_url            → First product image URL
 *   is_active            → true/false
 *
 * Server-side only.
 */

import { getAppProducts } from '@/lib/shopify/products';
import type { AppProduct } from '@/lib/shopify/types';
import { wpSyncProduct } from './client';

// ── ACF Field Mapping ───────────────────────────────────────────────────────

/**
 * Maps an AppProduct to the ACF field values for WordPress.
 * Adjust field names here to match your ACF setup.
 */
function productToAcf(product: AppProduct): Record<string, unknown> {
  return {
    shopify_product_id: product.shopifyProductId,
    shopify_handle: product.handle,
    // Price: convert Rappen back to CHF decimal (e.g. 14900 → "149.00")
    price: (product.price / 100).toFixed(2),
    compare_at_price: product.compareAtPrice
      ? (product.compareAtPrice / 100).toFixed(2)
      : '',
    short_description: product.shortDescription || '',
    badge: product.badge || '',
    icon_text_1: product.iconText1 || '',
    icon_text_2: product.iconText2 || '',
    icon_text_3: product.iconText3 || '',
    // Store USP items as a JSON string — parse in WP/ACF with a text field
    usp_items: JSON.stringify(product.uspItems),
    // Description as plain text (ACF textarea field — HTML stripped)
    description: product.descriptionText || '',
    // Inventory / Availability from first variant
    inventory: product.variants[0]?.available ? 'available' : 'out_of_stock',
    // First image URL for display
    image_url: product.images[0]?.url || '',
    image_alt: product.images[0]?.altText || product.title,
    // All images as JSON for gallery ACF field
    images_json: JSON.stringify(product.images),
    is_active: product.active ? '1' : '0',
    product_type: product.productType || '',
  };
}

// ── Sync Result Types ───────────────────────────────────────────────────────

export interface SyncResult {
  created: string[];
  updated: string[];
  skipped: string[];
  errors: { handle: string; error: string }[];
  totalShopify: number;
  totalWp: number;
}

// ── Main Sync Function ──────────────────────────────────────────────────────

/**
 * Syncs all Shopify products tagged for Nachklang → WordPress CPT with ACF.
 *
 * @returns SyncResult with details of what was created/updated/skipped/errored.
 */
export async function syncProductsToWordPress(): Promise<SyncResult> {
  const result: SyncResult = {
    created: [],
    updated: [],
    skipped: [],
    errors: [],
    totalShopify: 0,
    totalWp: 0,
  };

  // 1. Fetch all Shopify products
  let shopifyProducts: AppProduct[];
  try {
    shopifyProducts = await getAppProducts();
    result.totalShopify = shopifyProducts.length;
    console.log(`[WP Sync] Fetched ${shopifyProducts.length} Shopify products.`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[WP Sync] Failed to fetch Shopify products: ${msg}`);
    result.errors.push({ handle: '__shopify_fetch__', error: msg });
    return result;
  }


  // 3. Upsert each Shopify product into WordPress via custom endpoint
  // The custom endpoint handles create-or-update by slug internally using update_field()
  for (const product of shopifyProducts) {
    const handle = product.handle;

    try {
      const syncResult = await wpSyncProduct({
        slug: handle,
        title: product.title,
        fields: productToAcf(product),
      });

      if (syncResult.action === 'created') {
        result.created.push(handle);
        console.log(`[WP Sync] Created: ${handle} (WP ID: ${syncResult.post_id})`);
      } else {
        result.updated.push(handle);
        console.log(`[WP Sync] Updated: ${handle} (WP ID: ${syncResult.post_id})`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[WP Sync] Error for ${handle}: ${msg}`);
      result.errors.push({ handle, error: msg });
    }
  }

  console.log(
    `[WP Sync] Done. Created: ${result.created.length}, Updated: ${result.updated.length}, Errors: ${result.errors.length}`
  );
  return result;
}
