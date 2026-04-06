/**
 * Admin: Product Detail (Read-Only Shopify View)
 *
 * params.id = Shopify Product ID (numeric, e.g. "9876543210")
 * Links directly to Shopify Admin for editing.
 *
 * REPLACED: Supabase `products` table query + ProductForm
 * DEPRECATED: ProductForm.tsx, actions.ts (createProduct, updateProduct, deleteProduct)
 *             — can be deleted once this is confirmed stable
 */

import { getAppProductById } from '@/lib/shopify/products';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Package, CheckCircle2 } from 'lucide-react';

interface Props {
  params: { id: string }; // Shopify Product ID (numeric)
}

const SHOPIFY_DOMAIN = process.env.SHOPIFY_SHOP_DOMAIN || '';
export const revalidate = 60;

export default async function EditProductPage({ params }: Props) {
  const product = await getAppProductById(params.id);

  if (!product) notFound();

  return (
    <div className="p-8 md:p-12">
      <header className="mb-10">
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Zurück zu Produkte
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-serif text-slate-900">{product.title}</h1>
            <p className="text-slate-500 mt-2">
              Dieses Produkt wird in Shopify verwaltet.
            </p>
          </div>
          <a
            href={`https://${SHOPIFY_DOMAIN}/admin/products/${product.shopifyProductId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-xl text-sm font-semibold hover:bg-slate-800 transition flex-shrink-0 ml-6"
          >
            <ExternalLink className="w-4 h-4" />
            In Shopify bearbeiten
          </a>
        </div>
      </header>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Images */}
        {product.images.length > 0 && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Bilder</h2>
            <div className="grid grid-cols-3 gap-3">
              {product.images.slice(0, 6).map((img, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={img.url}
                  alt={img.altText || product.title}
                  className="w-full aspect-square object-cover rounded-xl border border-stone-100"
                />
              ))}
            </div>
          </div>
        )}

        {/* Product Data */}
        <div className="space-y-6">
          {/* Price */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Preis</h2>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-serif font-medium text-slate-900">
                CHF {(product.price / 100).toFixed(2)}
              </span>
              {product.compareAtPrice && product.compareAtPrice > product.price && (
                <span className="text-slate-400 text-lg line-through">
                  CHF {(product.compareAtPrice / 100).toFixed(2)}
                </span>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Details</h2>
            <div>
              <p className="text-xs text-slate-500 mb-1">Handle / URL</p>
              <code className="text-sm font-mono text-slate-700">/medaillons/{product.handle}</code>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Shopify Product ID</p>
              <code className="text-sm font-mono text-slate-700">{product.shopifyProductId}</code>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Tags</p>
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <span key={tag} className="text-xs bg-stone-100 text-stone-700 px-2.5 py-1 rounded-full font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            {product.productType && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Produkttyp</p>
                <p className="text-sm text-slate-700">{product.productType}</p>
              </div>
            )}
          </div>

          {/* Variants */}
          {product.variants.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Varianten</h2>
              <div className="space-y-2">
                {product.variants.map((v) => (
                  <div key={v.id} className="flex items-center justify-between text-sm py-2 border-b border-stone-100 last:border-0">
                    <span className="text-slate-700 font-medium">{v.title}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-slate-900 font-semibold">CHF {(v.price / 100).toFixed(2)}</span>
                      {v.available ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sage-100 text-sage-800">Verfügbar</span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">Ausverkauft</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Short Description */}
        {product.shortDescription && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Kurzbeschreibung</h2>
            <p className="text-slate-700 text-sm leading-relaxed">{product.shortDescription}</p>
          </div>
        )}

        {/* USPs */}
        {product.uspItems.length > 0 && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Highlights / USPs</h2>
            <ul className="space-y-2">
              {product.uspItems.map((usp, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-sage-600 flex-shrink-0" />
                  {usp}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Description */}
        {product.descriptionText && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 md:col-span-2">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Beschreibung</h2>
            <div
              className="text-slate-600 text-sm leading-relaxed prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: product.description || product.descriptionText }}
            />
          </div>
        )}
      </div>

      {/* Deprecation notice */}
      <div className="mt-10 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-sm text-amber-800">
        <strong>Hinweis:</strong> Das lokale Admin-Formular (Erstellen / Bearbeiten / Löschen) ist deprecated.
        Alle Änderungen bitte direkt in{' '}
        <a
          href={`https://${SHOPIFY_DOMAIN}/admin/products/${product.shopifyProductId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline font-semibold"
        >
          Shopify Admin
        </a>{' '}
        vornehmen.
        Die Dateien <code>ProductForm.tsx</code> und <code>actions.ts</code> können nach Bestätigung entfernt werden.
      </div>

      {/* No Shopify links visible to public — these are admin-only */}
      <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
        <Package className="w-3.5 h-3.5" />
        Shopify GID: <code className="font-mono">{product.id}</code>
      </div>
    </div>
  );
}
