import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle2, Package } from 'lucide-react';
import type { AppProduct } from '@/lib/shopify/types';

interface ProductCardProps {
  product: AppProduct;
}

export default function ProductCard({ product }: ProductCardProps) {
  const imgUrl = product.images[0]?.url;
  const outOfStock = product.variants[0]?.available === false;

  return (
    <Link 
      href={`/medaillons/${product.handle}`} 
      className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-brand-900/5 overflow-hidden flex flex-col group hover:-translate-y-1 transition-all duration-300 h-full"
    >
      {/* 1:1 Image Container */}
      <div className="w-full relative overflow-hidden aspect-square border-b border-slate-100 bg-stone-50">
        <div className="absolute inset-0 bg-gradient-to-tr from-brand-secondary/40 to-brand-primary/10 opacity-60 group-hover:opacity-100 transition-opacity z-10 pointer-events-none"></div>
        
        {imgUrl ? (
          <Image 
            src={imgUrl} 
            alt={product.title} 
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-700" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center relative z-0">
            <Package className="w-16 h-16 text-stone-300" />
          </div>
        )}

        {/* Out of stock overlay */}
        {outOfStock && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-20">
            <span className="bg-white/95 backdrop-blur-sm text-slate-800 text-sm font-semibold px-5 py-2.5 rounded-full border border-slate-200 shadow-sm">
              Vorübergehend ausverkauft
            </span>
          </div>
        )}
      </div>

      <div className="p-8 flex flex-col flex-grow">
        {product.badge && (
          <div className="inline-flex self-start items-center gap-2 px-3 py-1.5 rounded-full bg-brand-50 text-brand-primary text-xs font-semibold uppercase tracking-wider mb-4 border border-brand-100/50">
            {product.badge}
          </div>
        )}
        
        <h3 className="text-2xl font-heading font-medium text-brand-navy mb-3 group-hover:text-brand-primary transition-colors">
          {product.title}
        </h3>
        
        <p className="text-slate-500 font-light text-sm leading-relaxed mb-6 flex-grow">
          {product.shortDescription || 'Ein würdevolles Andenken für die Ewigkeit.'}
        </p>

        <ul className="space-y-3 mb-8">
          {product.iconText1 && (
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" />
              <span className="text-slate-600 font-light text-sm">{product.iconText1}</span>
            </li>
          )}
          {product.iconText2 && (
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" />
              <span className="text-slate-600 font-light text-sm">{product.iconText2}</span>
            </li>
          )}
          {/* Fallbacks */}
          {!product.iconText1 && !product.iconText2 && (
            <>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" />
                <span className="text-slate-600 font-light text-sm">Lebenslange Freischaltung inkl.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" />
                <span className="text-slate-600 font-light text-sm">Wetterfestes Material</span>
              </li>
            </>
          )}
        </ul>

        <div className="border-t border-slate-100 pt-6 mt-auto flex items-center justify-between">
          <div>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <div className="text-xs text-slate-400 line-through mb-0.5">CHF {(product.compareAtPrice / 100).toFixed(2)}</div>
            )}
            {!product.compareAtPrice && (
              <div className="text-xs text-slate-400 font-light mb-0.5">Einmalig</div>
            )}
            <div className="text-2xl font-heading font-bold text-slate-900 leading-none tracking-tight">
              CHF {(product.price / 100).toFixed(2)}
            </div>
          </div>
          
          <div className={`btn btn-small shadow-sm transition-all ${outOfStock ? 'bg-slate-100 text-slate-400 border-none' : 'btn-primary group-hover:scale-105 group-hover:shadow-md'}`}>
            {outOfStock ? 'Ausverkauft' : 'Ansehen'}
          </div>
        </div>
      </div>
    </Link>
  );
}
