/**
 * Public Medaillons Product List
 *
 * Product data source: Shopify Admin GraphQL API (via getAppProducts)
 * Stock data source:   Supabase medallion_codes (inventory_status=in_stock)
 *
 * REPLACED: was loading from Supabase `products` table
 * KEPT:     stock count display from Supabase (medallion_codes)
 */

import { getAppProducts } from '@/lib/shopify/products';
import { Package } from 'lucide-react';
import ProductCard from '@/components/shop/ProductCard';
import type { AppProduct } from '@/lib/shopify/types';

export const metadata = {
  title: 'Medaillons | Nachklang CH',
  description: 'Entdecken Sie unsere exklusiven QR-Medaillons für würdevolle Gedenkstätten.',
};

// Revalidate page every 60 seconds to reflect Shopify product changes
export const revalidate = 60;

export default async function MedaillonsPage() {
  // 1. Load products from Shopify (only tag:nachklang-app, active)
  const products: AppProduct[] = await getAppProducts();

  // Stock display comes from Shopify variant.availableForSale
  // medallion_codes is used for actual QR code assignment at fulfillment (webhooks)
  // — not for frontend display. Shopify is the source of truth for display availability.

  return (
    <div className="flex-grow bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b border-stone-100 py-14 text-center px-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-serif text-slate-900 tracking-tight mb-4">
            Medaillons
          </h1>
          <p className="text-slate-500 text-lg font-light leading-relaxed">
            Physische QR-Medaillons, die für immer mit der digitalen Gedenkseite verbunden bleiben.
          </p>
        </div>
      </div>

      {/* Product Grid */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        {products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <ProductCard key={product.handle} product={product} />
            ))}
          </div>
        ) : (
          <div className="py-24 text-center">
            <Package className="w-12 h-12 text-stone-300 mx-auto mb-4" />
            <h3 className="text-xl font-serif text-slate-700 mb-2">Keine Produkte verfügbar</h3>
            <p className="text-slate-400 text-sm">Besuchen Sie uns bald wieder.</p>
          </div>
        )}
      </div>
    </div>
  );
}
