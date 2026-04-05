'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Globe, ShoppingBag, Zap, CheckCircle2, ChevronRight, Package } from 'lucide-react';
import Image from 'next/image';

interface Product {
  id: string;
  title: string;
  short_description: string | null;
  price_in_cents: number;
  gallery_images: string[];
}

type Step = 'choose' | 'loading';

interface Props {
  memorialId: string;
  onClose: () => void;
}

export default function UnlockModal({ memorialId, onClose }: Props) {
  const [step, setStep] = useState<Step>('choose');
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    fetch('/api/products/public')
      .then(r => r.json())
      .then(d => { setProducts(d.products || []); setLoadingProducts(false); });
  }, []);

  async function startCheckout(withMedaillon: boolean) {
    setStep('loading');

    // Option A: Unlock only
    if (!withMedaillon) {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memorial_id: memorialId }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      return;
    }

    // Option B: Unlock + Medallion combo
    const res = await fetch('/api/checkout/bundle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memorial_id: memorialId, product_id: selectedProductId }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100">
          <div>
            <h2 className="font-serif text-xl text-slate-900">Gedenkseite freischalten</h2>
            <p className="text-xs text-slate-500 mt-0.5">Wähle dein Paket</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-stone-100 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {step === 'loading' && (
          <div className="py-20 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-slate-400 mx-auto mb-3" />
              <p className="text-sm text-slate-500">Weiterleitung zu Stripe...</p>
            </div>
          </div>
        )}

        {step === 'choose' && (
          <div className="p-6 space-y-4">
            {/* Option 1: Just unlock */}
            <button
              onClick={() => startCheckout(false)}
              className="w-full text-left border-2 border-stone-200 hover:border-slate-400 rounded-2xl p-5 transition group"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-stone-100 group-hover:bg-stone-200 rounded-xl flex items-center justify-center flex-shrink-0 transition">
                  <Globe className="w-5 h-5 text-slate-600" />
                </div>
                <div className="flex-grow">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-slate-900">Nur Seite freischalten</h3>
                    <span className="text-lg font-serif font-medium text-slate-900">CHF 49.–</span>
                  </div>
                  <p className="text-sm text-slate-500 font-light">Öffentliche URL, teilbar ohne Anmeldung. QR-Code Weiterleitung aktiv.</p>
                  <ul className="mt-3 space-y-1.5">
                    {['Permanente öffentliche URL', 'Ohne Anmeldung für andere sichtbar', 'QR-Code Scan-Weiterleitung'].map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs text-slate-600">
                        <CheckCircle2 className="w-3.5 h-3.5 text-sage-500 flex-shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-800 flex-shrink-0 mt-1 transition" />
              </div>
            </button>

            {/* Option 2: Unlock + Medallion */}
            <div className="border-2 border-sage-200 bg-sage-50/30 rounded-2xl p-5 relative overflow-hidden">
              <div className="absolute top-3 right-3 bg-sage-600 text-white text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full">
                Empfohlen
              </div>

              <div className="flex items-start gap-4 mb-4">
                <div className="w-10 h-10 bg-sage-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <ShoppingBag className="w-5 h-5 text-sage-700" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">Seite + Medaillon</h3>
                  <p className="text-sm text-slate-500 font-light">Alles zusammen: Freischaltung und ein graviertes QR-Medaillon für das Grab.</p>
                </div>
              </div>

              {/* Product selection */}
              {loadingProducts ? (
                <div className="py-4 flex justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                </div>
              ) : products.length > 0 ? (
                <div className="space-y-2 mb-4">
                  {products.map(p => {
                    const img = p.gallery_images?.[0];
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedProductId(p.id)}
                        className={`w-full text-left flex items-center gap-3 p-3 rounded-xl border-2 transition ${
                          selectedProductId === p.id
                            ? 'border-sage-600 bg-sage-50'
                            : 'border-stone-200 bg-white hover:border-stone-300'
                        }`}
                      >
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-stone-100 flex-shrink-0">
                          {img ? (
                            <Image src={img} alt={p.title} fill className="object-cover" />
                          ) : (
                            <Package className="w-5 h-5 text-stone-300 absolute inset-0 m-auto" />
                          )}
                        </div>
                        <div className="flex-grow min-w-0">
                          <p className="font-medium text-slate-900 text-sm truncate">{p.title}</p>
                          {p.short_description && (
                            <p className="text-xs text-slate-500 truncate">{p.short_description}</p>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-medium text-slate-900">+ CHF {((p.price_in_cents || 0) / 100).toFixed(0)}.–</p>
                          <p className="text-[10px] text-slate-400">+ CHF 49 Freisch.</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-slate-400 text-center py-3">Keine Medaillons verfügbar</p>
              )}

              <button
                onClick={() => selectedProductId && startCheckout(true)}
                disabled={!selectedProductId}
                className="w-full bg-sage-700 hover:bg-sage-800 text-white py-3 rounded-xl font-semibold text-sm transition flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Zap className="w-4 h-4" />
                {selectedProductId
                  ? `Freischalten + Medaillon (CHF ${49 + ((products.find(p => p.id === selectedProductId)?.price_in_cents || 0) / 100)}.–)`
                  : 'Erst ein Medaillon auswählen'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
