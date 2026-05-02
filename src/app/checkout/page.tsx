'use client';

/**
 * /checkout — WP Cart → Stripe Checkout
 *
 * Flow:
 *   WordPress Shop → User klickt "Zur Kasse" → Redirect zu /checkout?cart_id=xxx
 *   Diese Seite liest den Cart aus localStorage, zeigt eine Zusammenfassung
 *   und leitet dann via /api/checkout/from-cart zu Stripe weiter.
 *
 * Note: useSearchParams() muss in <Suspense> gewrappt sein (Next.js 14 Anforderung).
 */

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ShoppingBag, ArrowRight, Loader2, ArrowLeft, Gift, User } from 'lucide-react';

const STORAGE_KEY = 'nachklang_cart_v1';
const WP_SHOP = process.env.NEXT_PUBLIC_WP_URL
  ? `${process.env.NEXT_PUBLIC_WP_URL}/shop`
  : 'https://memorize.mainwebsite.ch/shop';

interface CartItem {
  key: string;
  post_id: string;
  variant_id: string;
  shopify_id: string;
  handle: string;
  title: string;
  url: string;
  image_url: string;
  price: number;
  product_type: string;
  purchase_type: 'self' | 'gift';
  purchase_label: string;
  quantity: number;
}

interface Cart {
  cart_id: string;
  items: CartItem[];
  updated_at?: string;
}

// ── Inner component that uses useSearchParams ─────────────────────────────────
// Must be wrapped in <Suspense> by the parent (Next.js 14 requirement)
function CheckoutInner() {
  const searchParams = useSearchParams();
  const cartId = searchParams.get('cart_id') || '';

  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: Cart = JSON.parse(raw);
        setCart(parsed);
      } else {
        setCart({ cart_id: cartId, items: [] });
      }
    } catch {
      setError('Warenkorb konnte nicht gelesen werden.');
      setCart({ cart_id: cartId, items: [] });
    }
  }, [cartId]);

  const subtotal = (cart?.items || []).reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1), 0
  );

  const formatChf = (amount: number) =>
    new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(amount);

  const handleCheckout = async () => {
    if (!cart || cart.items.length === 0) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/checkout/from-cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cart_id: cart.cart_id,
          items: cart.items,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Fehler beim Checkout');
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
      setLoading(false);
    }
  };

  // Loading state (cart not yet read from localStorage)
  if (!cart) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-stone-400 mx-auto mb-4 animate-spin" />
          <p className="text-slate-500">Warenkorb wird geladen…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-2xl mx-auto px-6 py-12">

        {/* Header */}
        <div className="mb-8">
          <Link href={WP_SHOP} className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 transition mb-6">
            <ArrowLeft className="w-3.5 h-3.5" /> Zurück zum Shop
          </Link>
          <h1 className="text-2xl font-serif text-slate-900">Dein Warenkorb</h1>
          <p className="text-sm text-slate-400 mt-1">
            {cart.items.length} Artikel {cartId && <span className="font-mono text-xs">· #{cartId.slice(-6)}</span>}
          </p>
        </div>

        {cart.items.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-stone-200 p-16 text-center">
            <ShoppingBag className="w-10 h-10 text-stone-300 mx-auto mb-3" />
            <p className="text-slate-500 mb-4">Dein Warenkorb ist leer.</p>
            <Link href={WP_SHOP} className="text-sm font-medium text-slate-700 hover:text-slate-900">
              Weiter einkaufen →
            </Link>
          </div>
        ) : (
          <>
            {/* Cart items */}
            <div className="space-y-3 mb-6">
              {cart.items.map(item => (
                <div key={item.key} className="bg-white rounded-2xl border border-stone-100 p-4 flex gap-4 items-center">
                  {item.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image_url} alt={item.title} className="w-16 h-16 object-cover rounded-xl flex-shrink-0" />
                  ) : (
                    <div className="w-16 h-16 bg-stone-100 rounded-xl flex-shrink-0 flex items-center justify-center">
                      <ShoppingBag className="w-6 h-6 text-stone-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{item.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {item.purchase_type === 'gift' ? (
                        <span className="flex items-center gap-1 text-xs text-violet-600 font-medium">
                          <Gift className="w-3 h-3" /> Als Geschenk
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <User className="w-3 h-3" /> Für mich
                        </span>
                      )}
                      <span className="text-slate-300">·</span>
                      <span className="text-xs text-slate-400">Qty: {item.quantity}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-slate-900">{formatChf(Number(item.price) * item.quantity)}</p>
                    <p className="text-xs text-slate-400">{formatChf(Number(item.price))} / Stk</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary + Checkout */}
            <div className="bg-white rounded-2xl border border-stone-100 p-5">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-500">Zwischensumme</span>
                <span className="font-semibold text-slate-900">{formatChf(subtotal)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400 mb-5">
                <span>Versand</span>
                <span>Wird berechnet</span>
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-xl p-3 mb-4">{error}</p>
              )}

              <button
                onClick={handleCheckout}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-slate-800 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Weiterleitung…</>
                ) : (
                  <>Zur Kasse <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
              <p className="text-xs text-slate-400 text-center mt-3">
                Sicherer Checkout via Stripe · SSL verschlüsselt
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Page export — wraps CheckoutInner in Suspense ─────────────────────────────
export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-stone-400 animate-spin" />
      </div>
    }>
      <CheckoutInner />
    </Suspense>
  );
}
