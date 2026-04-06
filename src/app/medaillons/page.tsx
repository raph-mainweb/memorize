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
import Image from 'next/image';
import Link from 'next/link';
import { Package } from 'lucide-react';
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => {
              const img = product.images[0];
              // Stock display: use Shopify variant.availableForSale
              // Shopify manages display availability (set to 0 in Shopify to show "Ausverkauft")
              const outOfStock = product.variants[0]?.available === false;

              return (
                <Link
                  key={product.handle}
                  href={`/medaillons/${product.handle}`}
                  className="group bg-white rounded-3xl overflow-hidden border border-stone-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Product Image */}
                  <div className="relative aspect-square bg-stone-100 overflow-hidden">
                    {img ? (
                      <Image
                        src={img.url}
                        alt={img.altText || product.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-16 h-16 text-stone-300" />
                      </div>
                    )}

                    {/* Out of stock overlay */}
                    {outOfStock && (
                      <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
                        <span className="bg-white/90 backdrop-blur-sm text-slate-600 text-sm font-semibold px-4 py-2 rounded-full border border-slate-200 shadow-sm">
                          Ausverkauft
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-5">
                    <h3 className="font-serif text-xl text-slate-900 mb-1 group-hover:text-sage-700 transition">
                      {product.title}
                    </h3>
                    {product.shortDescription && (
                      <p className="text-slate-500 text-sm line-clamp-2 mb-3 font-light">
                        {product.shortDescription}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-medium text-slate-900">
                          CHF {(product.price / 100).toFixed(2)}
                        </span>
                        {product.compareAtPrice && product.compareAtPrice > product.price && (
                          <span className="text-sm text-slate-400 line-through">
                            CHF {(product.compareAtPrice / 100).toFixed(2)}
                          </span>
                        )}
                      </div>
                      {outOfStock && (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-stone-100 text-stone-500">
                          Ausverkauft
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
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
