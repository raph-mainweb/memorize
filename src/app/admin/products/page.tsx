/**
 * Admin: Product List (Read-Only Shopify View)
 *
 * Products are managed in Shopify — this page shows a live view
 * of all nachklang-app tagged products from Shopify Admin.
 *
 * REPLACED: Supabase `products` table query
 * DEPRECATED: "Neues Produkt" button — create products in Shopify instead
 */

import { getAppProducts } from '@/lib/shopify/products';
import Link from 'next/link';
import { ExternalLink, Package } from 'lucide-react';

const SHOPIFY_DOMAIN = process.env.SHOPIFY_SHOP_DOMAIN || '';
export const revalidate = 60;

export default async function ProductsPage() {
  const products = await getAppProducts();

  return (
    <div className="p-8 md:p-12">
      <header className="mb-10 flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-serif text-slate-900">Produkte</h1>
          <p className="text-slate-500 mt-2">
            Produkte werden in Shopify gepflegt.{' '}
            <a
              href={`https://${SHOPIFY_DOMAIN}/admin/products`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-700 underline underline-offset-2 hover:text-slate-900 transition"
            >
              Shopify öffnen →
            </a>
          </p>
        </div>
        <a
          href={`https://${SHOPIFY_DOMAIN}/admin/products/new`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-xl text-sm font-semibold hover:bg-slate-800 transition"
        >
          <ExternalLink className="w-4 h-4" />
          In Shopify erstellen
        </a>
      </header>

      {/* Tag info */}
      <div className="mb-6 p-4 bg-stone-50 border border-stone-200 rounded-2xl text-sm text-slate-600">
        <strong className="text-slate-900">Filter:</strong> Nur Produkte mit Tag{' '}
        <code className="bg-stone-200 px-1.5 py-0.5 rounded text-xs font-mono">
          {process.env.SHOPIFY_PRODUCT_TAG || 'nachklang-app'}
        </code>{' '}
        werden hier angezeigt.
      </div>

      <div className="space-y-4">
        {products.length > 0 ? (
          products.map((p) => (
            <div
              key={p.handle}
              className="flex items-center justify-between bg-white p-6 rounded-3xl border border-slate-200 shadow-sm"
            >
              <div className="flex items-center gap-4 min-w-0">
                {/* Thumbnail */}
                {p.images[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.images[0].url}
                    alt={p.images[0].altText || p.title}
                    className="w-14 h-14 rounded-xl object-cover flex-shrink-0 border border-stone-100"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-stone-100 flex items-center justify-center flex-shrink-0">
                    <Package className="w-6 h-6 text-stone-400" />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <h3 className="font-semibold text-slate-900 truncate">{p.title}</h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-sage-100 text-sage-800 flex-shrink-0">
                      Aktiv
                    </span>
                  </div>
                  {p.shortDescription && (
                    <p className="text-sm text-slate-500 truncate">{p.shortDescription}</p>
                  )}
                  <p className="text-xs text-slate-400 mt-0.5 font-mono">/medaillons/{p.handle}</p>
                </div>
              </div>

              <div className="flex items-center gap-6 flex-shrink-0 ml-6">
                <div className="text-right">
                  <p className="font-semibold text-slate-900 text-lg">
                    CHF {(p.price / 100).toFixed(2)}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    ID: {p.shopifyProductId}
                  </p>
                </div>
                <a
                  href={`https://${SHOPIFY_DOMAIN}/admin/products/${p.shopifyProductId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 border border-slate-200 px-3 py-2 rounded-xl hover:bg-stone-50 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Shopify
                </a>
              </div>
            </div>
          ))
        ) : (
          <div className="p-16 text-center text-slate-400 border border-dashed border-slate-200 rounded-3xl bg-white">
            <Package className="w-10 h-10 mx-auto mb-4 text-stone-300" />
            <p className="mb-2 font-medium text-slate-600">Keine Produkte gefunden</p>
            <p className="text-sm mb-6">
              Erstelle Produkte in Shopify und markiere sie mit dem Tag{' '}
              <code className="bg-stone-100 px-1.5 py-0.5 rounded text-xs">
                {process.env.SHOPIFY_PRODUCT_TAG || 'nachklang-app'}
              </code>
            </p>
            <a
              href={`https://${SHOPIFY_DOMAIN}/admin/products/new`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-800 transition"
            >
              <ExternalLink className="w-4 h-4" />
              In Shopify erstellen
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
