/**
 * DEBUG: Shopify Connection Test
 * GET /api/debug/shopify
 *
 * Temporary route — remove after debugging is done.
 * Admin-only endpoint to test Shopify API connectivity.
 */

import { NextResponse } from 'next/server';

const SHOPIFY_DOMAIN = process.env.SHOPIFY_SHOP_DOMAIN;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_CLIENT_SECRET;
const SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION || '2026-04';

export async function GET() {
  const config = {
    domain: SHOPIFY_DOMAIN || '(MISSING)',
    tokenPrefix: SHOPIFY_ACCESS_TOKEN ? SHOPIFY_ACCESS_TOKEN.substring(0, 8) + '...' : '(MISSING)',
    apiVersion: SHOPIFY_API_VERSION,
    tag: process.env.SHOPIFY_PRODUCT_TAG || 'nachklang-app',
    endpoint: `https://${SHOPIFY_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`,
  };

  if (!SHOPIFY_DOMAIN || !SHOPIFY_ACCESS_TOKEN) {
    return NextResponse.json({ error: 'Missing env vars', config }, { status: 500 });
  }

  // Test 1: Simple shop query (minimal permissions needed)
  const shopQuery = `{ shop { name plan { displayName } } }`;

  let shopResult = null;
  let shopError = null;
  try {
    const res = await fetch(
      `https://${SHOPIFY_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
        },
        body: JSON.stringify({ query: shopQuery }),
        cache: 'no-store',
      }
    );
    const json = await res.json();
    shopResult = { httpStatus: res.status, data: json.data, errors: json.errors };
    if (!res.ok) shopError = `HTTP ${res.status}`;
  } catch (e) {
    shopError = String(e);
  }

  // Test 2: Products query with tag filter
  const productsQuery = `{
    products(first: 5, query: "tag:nachklang-app AND status:active") {
      edges {
        node {
          id
          title
          handle
          status
          tags
        }
      }
    }
  }`;

  let productsResult = null;
  let productsError = null;
  try {
    const res = await fetch(
      `https://${SHOPIFY_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
        },
        body: JSON.stringify({ query: productsQuery }),
        cache: 'no-store',
      }
    );
    const json = await res.json();
    productsResult = { httpStatus: res.status, data: json.data, errors: json.errors };
    if (!res.ok) productsError = `HTTP ${res.status}`;
  } catch (e) {
    productsError = String(e);
  }

  // Test 3: All products (no tag filter) - see if ANY products are accessible
  const allProductsQuery = `{
    products(first: 5) {
      edges {
        node {
          id
          title
          status
          tags
        }
      }
    }
  }`;

  let allProductsResult = null;
  try {
    const res = await fetch(
      `https://${SHOPIFY_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
        },
        body: JSON.stringify({ query: allProductsQuery }),
        cache: 'no-store',
      }
    );
    const json = await res.json();
    allProductsResult = { httpStatus: res.status, data: json.data, errors: json.errors };
  } catch (e) {
    allProductsResult = { error: String(e) };
  }

  return NextResponse.json({
    config,
    shop: { result: shopResult, error: shopError },
    taggedProducts: { result: productsResult, error: productsError },
    allProducts: { result: allProductsResult },
  });
}
