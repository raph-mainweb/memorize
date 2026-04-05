import { createAdminClient } from '@/utils/supabase/admin';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { CheckCircle2, ArrowLeft, Package } from 'lucide-react';
import MedaillonCheckoutButton from '../MedaillonCheckoutButton';
import MedaillonGallery from './MedaillonGallery';

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props) {
  const supabase = createAdminClient();
  const { data } = await supabase.from('products').select('title, short_description').eq('id', params.id).single();
  return {
    title: data ? `${data.title} | Nachklang CH` : 'Medaillon | Nachklang CH',
    description: data?.short_description || 'Exklusives QR-Medaillon für eine würdevolle Gedenkstätte.',
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const supabase = createAdminClient();
  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', params.id)
    .eq('is_active', true)
    .single();

  if (!product) notFound();

  const images: string[] = product.gallery_images || [];
  const usps: string[] = product.usp || [];

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
          <MedaillonGallery images={images} title={product.title} />

          {/* Right: Product Info */}
          <div className="flex flex-col">
            <h1 className="text-3xl md:text-4xl font-serif text-slate-900 mb-2">
              {product.title}
            </h1>
            {product.short_description && (
              <p className="text-slate-500 font-light text-base mb-6">{product.short_description}</p>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-3xl font-serif font-medium text-slate-900">
                CHF {((product.price_in_cents || 0) / 100).toFixed(2)}
              </span>
              <span className="text-slate-400 text-sm">inkl. Versand & Gravur</span>
            </div>

            {/* CTA */}
            <div className="flex flex-col gap-3 mb-8">
              <MedaillonCheckoutButton productId={product.id} productTitle={product.title} />
              <Link
                href="/dashboard/neu"
                className="text-center py-3.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 transition"
              >
                Erst Gedenkseite erstellen
              </Link>
            </div>

            {/* USPs */}
            {usps.length > 0 && (
              <div className="border-t border-stone-100 pt-6 mb-6">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Highlights</h3>
                <ul className="space-y-3">
                  {usps.map((usp, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-sage-600 flex-shrink-0" />
                      {usp}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Description */}
            {product.description && (
              <div className="border-t border-stone-100 pt-6">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Beschreibung</h3>
                <p className="text-slate-600 leading-relaxed text-sm whitespace-pre-line">{product.description}</p>
              </div>
            )}

            <p className="text-xs text-slate-400 mt-8">
              Das Medaillon wird nach der Bestellung mit dem QR-Code deiner Gedenkseite graviert und per Post zugestellt.
            </p>
          </div>
        </div>
      </div>

      {/* Other products */}
      <OtherProducts currentId={product.id} />
    </div>
  );
}

async function OtherProducts({ currentId }: { currentId: string }) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('products')
    .select('id, title, price_in_cents, gallery_images')
    .eq('is_active', true)
    .neq('id', currentId)
    .limit(3);

  if (!data || data.length === 0) return null;

  return (
    <div className="max-w-6xl mx-auto px-6 py-16 border-t border-stone-100">
      <h2 className="text-2xl font-serif text-slate-900 mb-8">Weitere Medaillons</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {data.map(p => {
          const img = p.gallery_images?.[0];
          return (
            <Link key={p.id} href={`/medaillons/${p.id}`} className="group">
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-stone-100 mb-3">
                {img ? (
                  <Image src={img} alt={p.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-10 h-10 text-stone-300" />
                  </div>
                )}
              </div>
              <h3 className="font-medium text-slate-900 group-hover:text-sage-700 transition">{p.title}</h3>
              <p className="text-slate-500 text-sm">CHF {((p.price_in_cents || 0) / 100).toFixed(2)}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
