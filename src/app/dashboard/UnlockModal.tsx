'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Globe, ShoppingBag, ArrowRight, ExternalLink, Package, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';

interface Product {
  id: string;
  title: string;
  short_description: string | null;
  price_in_cents: number;
  gallery_images: string[];
  wp_url: string | null;
}

type Step = 'choose' | 'medallion' | 'loading';
type Choice = 'page' | 'bundle';

interface Props {
  memorialId: string;
  onClose: () => void;
}

export default function UnlockModal({ memorialId, onClose }: Props) {
  const [step, setStep]               = useState<Step>('choose');
  const [choice, setChoice]           = useState<Choice>('bundle'); // Empfohlen vorselektiert
  const [products, setProducts]       = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [loadingProducts, setLoadingProducts]     = useState(true);

  useEffect(() => {
    fetch('/api/products/public')
      .then(r => r.json())
      .then(d => {
        const prods = d.products || [];
        setProducts(prods);
        if (prods.length > 0) setSelectedProductId(prods[0].id);
        setLoadingProducts(false);
      });
  }, []);

  async function startCheckout(withMedaillon: boolean) {
    setStep('loading');
    if (!withMedaillon) {
      const res = await fetch('/api/checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memorial_id: memorialId }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      return;
    }
    const res = await fetch('/api/checkout/bundle', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memorial_id: memorialId, product_id: selectedProductId }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  }

  const selectedProduct = products.find(p => p.id === selectedProductId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100">
          <div>
            <h2 className="font-serif text-xl text-slate-900">
              {step === 'medallion' ? 'Medaillon wählen' : 'Gedenkseite freischalten'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {step === 'medallion' ? 'Freischaltung (CHF 49) ist bereits enthalten' : 'Wie möchtest du die Seite veröffentlichen?'}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-stone-100 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Loading ── */}
        {step === 'loading' && (
          <div className="py-20 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-slate-400 mx-auto mb-3" />
              <p className="text-sm text-slate-500">Weiterleitung zu Stripe...</p>
            </div>
          </div>
        )}

        {/* ── Step 1: Wählen ── */}
        {step === 'choose' && (
          <div className="p-6 space-y-3">

            {/* Karte: Nur Seite */}
            <button
              onClick={() => setChoice('page')}
              className={`w-full text-left rounded-2xl border-2 p-4 transition ${
                choice === 'page'
                  ? 'border-slate-900 bg-slate-50'
                  : 'border-stone-200 hover:border-stone-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${choice === 'page' ? 'bg-slate-900' : 'bg-stone-100'}`}>
                    <Globe className={`w-4 h-4 ${choice === 'page' ? 'text-white' : 'text-slate-500'}`} />
                  </div>
                  <span className="font-semibold text-slate-900">Nur Seite</span>
                </div>
                <span className="font-serif font-medium text-slate-900">CHF 49.–</span>
              </div>
            </button>

            {/* Karte: Seite + Medaillon */}
            <button
              onClick={() => setChoice('bundle')}
              className={`w-full text-left rounded-2xl border-2 p-4 transition relative ${
                choice === 'bundle'
                  ? 'border-sage-600 bg-sage-50/40'
                  : 'border-stone-200 hover:border-stone-300'
              }`}
            >
              <div className="absolute top-3 right-3 bg-sage-600 text-white text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full">
                Empfohlen
              </div>
              <div className="flex items-center justify-between pr-20">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${choice === 'bundle' ? 'bg-sage-600' : 'bg-stone-100'}`}>
                    <ShoppingBag className={`w-4 h-4 ${choice === 'bundle' ? 'text-white' : 'text-slate-500'}`} />
                  </div>
                  <span className="font-semibold text-slate-900">Seite + Medaillon</span>
                </div>
                <span className="font-serif font-medium text-slate-900">ab CHF 52.–</span>
              </div>
            </button>

            {/* Weiter Button */}
            <button
              onClick={() => {
                if (choice === 'page') startCheckout(false);
                else setStep('medallion');
              }}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-2xl font-semibold text-sm transition flex items-center justify-center gap-2 mt-2"
            >
              Weiter <ArrowRight className="w-4 h-4" />
            </button>

            {/* Später entscheiden */}
            <button onClick={onClose} className="w-full text-center text-sm text-slate-400 hover:text-slate-600 transition py-1">
              Später entscheiden
            </button>
          </div>
        )}

        {/* ── Step 2: Medaillon wählen ── */}
        {step === 'medallion' && (
          <div className="p-6 space-y-4">
            {loadingProducts ? (
              <div className="py-8 flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            ) : products.length > 0 ? (
              <div className="space-y-2">
                {products.map(p => {
                  const img = p.gallery_images?.[0];
                  const isSelected = selectedProductId === p.id;
                  return (
                    <button key={p.id} type="button" onClick={() => setSelectedProductId(p.id)}
                      className={`w-full text-left flex items-center gap-3 p-3 rounded-xl border-2 transition ${
                        isSelected ? 'border-sage-600 bg-sage-50' : 'border-stone-200 bg-white hover:border-stone-300'
                      }`}>
                      {/* Produktbild */}
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-stone-100 flex-shrink-0">
                        {img ? (
                          <Image src={img} alt={p.title} fill className="object-cover" />
                        ) : (
                          <Package className="w-5 h-5 text-stone-300 absolute inset-0 m-auto" />
                        )}
                      </div>
                      {/* Info */}
                      <div className="flex-grow min-w-0">
                        <p className="font-medium text-slate-900 text-sm truncate">{p.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-slate-500">
                            CHF {((49 * 100 + (p.price_in_cents || 0)) / 100).toFixed(0)}.–
                          </span>
                          {p.wp_url && (
                            <a href={p.wp_url} target="_blank" rel="noopener noreferrer"
                              onClick={e => e.stopPropagation()}
                              className="flex items-center gap-0.5 text-[11px] text-sage-600 hover:text-sage-700 transition">
                              Im Shop ansehen <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                      </div>
                      {/* Selected indicator */}
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-sage-600 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-6">Keine Medaillons verfügbar</p>
            )}

            {/* Weiter mit gewähltem Produkt */}
            <button
              onClick={() => selectedProductId && startCheckout(true)}
              disabled={!selectedProductId || loadingProducts}
              className="w-full bg-sage-700 hover:bg-sage-800 text-white py-3.5 rounded-2xl font-semibold text-sm transition flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {selectedProduct
                ? `Weiter mit ${selectedProduct.title} →`
                : 'Erst ein Medaillon auswählen'}
            </button>

            {/* Zurück */}
            <button onClick={() => setStep('choose')}
              className="w-full text-center text-sm text-slate-400 hover:text-slate-600 transition py-1">
              ← Zurück
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
