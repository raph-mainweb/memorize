/**
 * Public Medaillon Product Detail Page
 *
 * Route: /medaillons/[handle] (folder named [id] for Next.js, param treated as Shopify handle)
 *
 * Product data source: Shopify Admin GraphQL API (via getAppProductByHandle)
 * Stock data source:   Supabase medallion_codes (inventory_status=in_stock)
 *
 * REPLACED: was loading from Supabase `products` table via UUID
 * - params.id is now a Shopify handle (e.g. "silber-medaillon"), not a UUID
 * - Old UUID-based URLs (/medaillons/3f2a9b4c-...) will return 404
 */

import { getAppProductByHandle, getAppProducts } from '@/lib/shopify/products';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { CheckCircle2, ArrowLeft, Package } from 'lucide-react';
import MedaillonCheckoutButton from '../MedaillonCheckoutButton';
import MedaillonGallery from './MedaillonGallery';
import type { AppProduct } from '@/lib/shopify/types';

interface Props {
  params: { id: string }; // "id" param acts as Shopify handle
}

export const revalidate = 60;

export async function generateMetadata({ params }: Props) {
  const product = await getAppProductByHandle(params.id);
  return {
    title: product ? `${product.title} | Nachklang CH` : 'Medaillon | Nachklang CH',
    description: product?.shortDescription || product?.descriptionText?.slice(0, 160) || 'Exklusives QR-Medaillon für eine würdevolle Gedenkstätte.',
  };
}

export default async function ProductDetailPage({ params }: Props) {
  // params.id is the Shopify handle (e.g. "silber-medaillon")
  const product = await getAppProductByHandle(params.id);

  if (!product) notFound();

  // Stock display: use Shopify variant.available
  // Shopify is the source of truth for display availability.
  // medallion_codes handles actual QR-code assignment on purchase (webhook).
  const firstVariant = product.variants[0];
  const availableStock = firstVariant?.available !== false ? 1 : 0;

  return (
    <div className="flex-grow bg-white">
      {/* Breadcrumb */}
      <div className="max-w-6xl mx-auto px-6 pt-8">
        <Link href="/medaillons" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition">
          <ArrowLeft className="w-4 h-4" />
          Alle Medaillons
        </Link>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid md:grid-cols-2 gap-12 lg:gap-20">

          {/* Left: Gallery */}
          <MedaillonGallery
            images={product.images.map(img => img.url)}
            title={product.title}
          />

          {/* Right: Product Info */}
          <div className="flex flex-col">
            <h1 className="text-3xl md:text-4xl font-serif text-slate-900 mb-2">
              {product.title}
            </h1>

            {product.shortDescription && (
              <p className="text-slate-500 font-light text-base mb-6">{product.shortDescription}</p>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-3xl font-serif font-medium text-slate-900">
                CHF {(product.price / 100).toFixed(2)}
              </span>
              {product.compareAtPrice && product.compareAtPrice > product.price && (
                <span className="text-slate-400 text-lg line-through">
                  CHF {(product.compareAtPrice / 100).toFixed(2)}
                </span>
              )}
              <span className="text-slate-400 text-sm">inkl. Versand & Gravur</span>
            </div>

            {/* Out of stock indicator */}
            {availableStock === 0 && (
              <div className="flex items-center gap-2 mb-6">
                <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
                <span className="text-sm text-red-600 font-medium">Ausverkauft</span>
              </div>
            )}

            {/* CTA */}
            <div className="flex flex-col gap-3 mb-8">
              <MedaillonCheckoutButton
                shopifyHandle={product.handle}
                shopifyProductId={product.shopifyProductId}
                shopifyVariantId={product.variants[0]?.shopifyVariantId ?? null}
                productTitle={product.title}
                price={product.price}
                stock={availableStock}
              />
              <Link
                href="/dashboard/neu"
                className="text-center py-3.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 transition"
              >
                Erst Gedenkseite erstellen
              </Link>
            </div>

            {/* USPs from Shopify metafield nachklang.usp */}
            {product.uspItems.length > 0 && (
              <div className="border-t border-stone-100 pt-6 mb-6">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Highlights</h3>
                <ul className="space-y-3">
                  {product.uspItems.map((usp, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-sage-600 flex-shrink-0" />
                      {usp}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Description from Shopify */}
            {product.descriptionText && (
              <div className="border-t border-stone-100 pt-6">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Beschreibung</h3>
                {product.description ? (
                  <div
                    className="text-slate-600 leading-relaxed text-sm prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: product.description }}
                  />
                ) : (
                  <p className="text-slate-600 leading-relaxed text-sm">{product.descriptionText}</p>
                )}
              </div>
            )}

            <p className="text-xs text-slate-400 mt-8">
              Das Medaillon wird nach der Bestellung mit dem QR-Code deiner Gedenkseite graviert und per Post zugestellt.
            </p>
          </div>
        </div>
      </div>

      {/* Other products */}
      <OtherProducts currentHandle={product.handle} />
    </div>
  );
}

async function OtherProducts({ currentHandle }: { currentHandle: string }) {
  const allProducts: AppProduct[] = await getAppProducts();
  const others = allProducts.filter((p) => p.handle !== currentHandle).slice(0, 3);

  if (others.length === 0) return null;

  return (
    <div className="max-w-6xl mx-auto px-6 py-16 border-t border-stone-100">
      <h2 className="text-2xl font-serif text-slate-900 mb-8">Weitere Medaillons</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {others.map((p) => {
          const img = p.images[0];
          return (
            <Link key={p.handle} href={`/medaillons/${p.handle}`} className="group">
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-stone-100 mb-3">
                {img ? (
                  <Image
                    src={img.url}
                    alt={img.altText || p.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-10 h-10 text-stone-300" />
                  </div>
                )}
              </div>
              <h3 className="font-medium text-slate-900 group-hover:text-sage-700 transition">{p.title}</h3>
              <p className="text-slate-500 text-sm">CHF {(p.price / 100).toFixed(2)}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
