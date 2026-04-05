import { createAdminClient } from '@/utils/supabase/admin';
import Image from 'next/image';
import Link from 'next/link';
import { CheckCircle2, ShieldCheck, Package } from 'lucide-react';
import MedaillonCheckoutButton from './MedaillonCheckoutButton';

export const metadata = {
  title: 'Medaillons | Nachklang CH',
  description: 'Exklusive QR-Medaillons für eine würdevolle Gedenkstätte. Entdecken Sie unsere Varianten.',
};

export default async function MedaillonsPage() {
  const supabase = createAdminClient();
  
  const { data: products } = await supabase
    .from('products')
    .select('id, title, short_description, description, price_in_cents, usp, gallery_images')
    .eq('is_active', true)
    .order('price_in_cents', { ascending: true });

  return (
    <div className="flex-grow bg-stone-50">
      
      {/* Hero */}
      <section className="w-full bg-white border-b border-stone-100 py-20 text-center px-6">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-stone-100 text-stone-600 text-xs font-semibold uppercase tracking-widest mb-6">
            <Package className="w-3.5 h-3.5" />
            Handgefertigte Qualität
          </div>
          <h1 className="text-4xl md:text-6xl font-serif text-slate-900 tracking-tight mb-6">
            Das Medaillon
          </h1>
          <p className="text-slate-500 text-lg md:text-xl font-light leading-relaxed max-w-xl mx-auto">
            Ein physisches, dauerhaftes Zeichen der Verbundenheit. Wetterfest, elegant, und für immer mit der digitalen Gedenkseite verbunden.
          </p>
        </div>
      </section>

      {/* Products */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        {products && products.length > 0 ? (
          <div className="space-y-24">
            {products.map((product, idx) => {
              const mainImage = product.gallery_images?.[0];
              const additionalImages = product.gallery_images?.slice(1, 4) || [];

              return (
                <div key={product.id} className={`grid md:grid-cols-2 gap-12 lg:gap-20 items-center ${idx % 2 === 1 ? 'md:[&>*:first-child]:order-2' : ''}`}>

                  {/* Image Gallery */}
                  <div className="space-y-3">
                    {mainImage ? (
                      <div className="relative w-full aspect-square rounded-3xl overflow-hidden bg-stone-100 shadow-lg">
                        <Image
                          src={mainImage}
                          alt={product.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-full aspect-square rounded-3xl overflow-hidden bg-gradient-to-br from-stone-200 to-stone-100 flex items-center justify-center shadow-lg border border-stone-200">
                        <div className="text-center text-stone-400">
                          <Package className="w-16 h-16 mx-auto mb-3 opacity-40" />
                          <p className="text-sm font-medium">Produktbild folgt</p>
                        </div>
                      </div>
                    )}
                    {additionalImages.length > 0 && (
                      <div className="grid grid-cols-3 gap-3">
                        {additionalImages.map((img, i) => (
                          <div key={i} className="relative aspect-square rounded-2xl overflow-hidden bg-stone-100 border border-stone-200">
                            <Image src={img} alt={`${product.title} ${i + 2}`} fill className="object-cover" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex flex-col">
                    <h2 className="text-3xl md:text-4xl font-serif text-slate-900 mb-3">{product.title}</h2>
                    {product.short_description && (
                      <p className="text-slate-500 text-base mb-6 font-light">{product.short_description}</p>
                    )}
                    {product.description && (
                      <p className="text-slate-600 leading-relaxed mb-8">{product.description}</p>
                    )}

                    {/* USPs */}
                    {product.usp && product.usp.length > 0 && (
                      <ul className="space-y-3 mb-8">
                        {product.usp.map((item: string, i: number) => (
                          <li key={i} className="flex items-center gap-3 text-sm text-slate-700">
                            <CheckCircle2 className="w-4 h-4 text-sage-600 flex-shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Price & CTA */}
                    <div className="border-t border-stone-200 pt-6 mt-auto">
                      <div className="flex items-baseline gap-2 mb-5">
                        <span className="text-3xl font-serif font-medium text-slate-900">
                          CHF {((product.price_in_cents || 0) / 100).toFixed(2)}
                        </span>
                        <span className="text-slate-400 text-sm font-light">inkl. Versand</span>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <MedaillonCheckoutButton productId={product.id} productTitle={product.title} />
                        <Link
                          href="/dashboard/neu"
                          className="flex-1 text-center py-3.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 transition"
                        >
                          Erst Seite erstellen
                        </Link>
                      </div>
                      <p className="text-xs text-slate-400 mt-3 text-center">Kann auch nach der Freischaltung separat bestellt werden.</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-20 text-center max-w-md mx-auto">
            <ShieldCheck className="w-12 h-12 text-stone-300 mx-auto mb-4" />
            <h3 className="text-xl font-serif text-slate-800 mb-2">Noch keine Medaillons verfügbar</h3>
            <p className="text-slate-500">Besuchen Sie uns bald wieder – wir arbeiten an unseren Produkten.</p>
          </div>
        )}
      </section>
    </div>
  );
}
