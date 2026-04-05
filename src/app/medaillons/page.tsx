import { createAdminClient } from '@/utils/supabase/admin';
import Image from 'next/image';
import Link from 'next/link';
import { Package } from 'lucide-react';

export const metadata = {
  title: 'Medaillons | Nachklang CH',
  description: 'Entdecken Sie unsere exklusiven QR-Medaillons für würdevolle Gedenkstätten.',
};

export default async function MedaillonsPage() {
  const supabase = createAdminClient();
  
  const { data: products } = await supabase
    .from('products')
    .select('id, title, short_description, price_in_cents, gallery_images')
    .eq('is_active', true)
    .order('price_in_cents', { ascending: true });

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
        {products && products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map(product => {
              const img = product.gallery_images?.[0];
              return (
                <Link
                  key={product.id}
                  href={`/medaillons/${product.id}`}
                  className="group bg-white rounded-3xl overflow-hidden border border-stone-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Product Image */}
                  <div className="relative aspect-square bg-stone-100 overflow-hidden">
                    {img ? (
                      <Image
                        src={img}
                        alt={product.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-16 h-16 text-stone-300" />
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-5">
                    <h3 className="font-serif text-xl text-slate-900 mb-1 group-hover:text-sage-700 transition">{product.title}</h3>
                    {product.short_description && (
                      <p className="text-slate-500 text-sm line-clamp-2 mb-3 font-light">{product.short_description}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-medium text-slate-900">
                        CHF {((product.price_in_cents || 0) / 100).toFixed(2)}
                      </span>
                      <span className="text-sm text-sage-600 font-medium group-hover:underline">
                        Details →
                      </span>
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
