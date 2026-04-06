/**
 * Public Products API Route
 *
 * Returns all active nachklang-app products from Shopify.
 * Server-side only — no Shopify credentials exposed to client.
 *
 * REPLACED: Supabase `products` table query
 */

import { NextResponse } from 'next/server';
import { getAppProducts } from '@/lib/shopify/products';

export const revalidate = 60;

export async function GET() {
  const products = await getAppProducts();
  return NextResponse.json({ products });
}
