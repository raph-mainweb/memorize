'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, ArrowRight, Loader2, ShoppingBag, User,
  Gift, CheckCircle2, Lock
} from 'lucide-react';

const WP_SHOP = process.env.NEXT_PUBLIC_WP_URL
  ? `${process.env.NEXT_PUBLIC_WP_URL}/shop`
  : 'https://memorize.mainwebsite.ch/shop';

// ── Types ─────────────────────────────────────────────────────────────────────

interface CartItem {
  key: string;
  handle: string;
  title: string;
  image_url?: string;
  price: number;
  quantity: number;
  purchase_type: 'self' | 'gift';
}

interface Cart {
  cart_id: string;
  items: CartItem[];
}

interface UserInfo {
  id: string;
  email: string;
}

interface Profile {
  first_name?: string | null;
  last_name?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  postal_code?: string | null;
  city?: string | null;
  country?: string | null;
  phone?: string | null;
}

interface Props {
  cartParam: string;
  user: UserInfo | null;
  profile: Profile | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function decodeCart(cartParam: string): Cart | null {
  if (!cartParam) return null;
  try {
    const decoded = atob(decodeURIComponent(cartParam));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

const formatChf = (amount: number) =>
  new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(amount);

const inputCls =
  'w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-slate-500 transition bg-white';

const labelCls = 'block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5';

// ── Component ─────────────────────────────────────────────────────────────────

export default function CheckoutForm({ cartParam, user, profile }: Props) {
  const cart = decodeCart(cartParam);

  const [form, setForm] = useState({
    email:         user?.email || '',
    first_name:    profile?.first_name || '',
    last_name:     profile?.last_name || '',
    address_line1: profile?.address_line1 || '',
    address_line2: profile?.address_line2 || '',
    postal_code:   profile?.postal_code || '',
    city:          profile?.city || '',
    country:       profile?.country || 'CH',
    phone:         profile?.phone || '',
  });
  const [createAccount, setCreateAccount] = useState(!user); // default on if not logged in
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const subtotal = (cart?.items || []).reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1), 0
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
          shipping: {
            name: `${form.first_name} ${form.last_name}`.trim(),
            email: form.email,
            phone: form.phone,
            address: {
              line1: form.address_line1,
              line2: form.address_line2,
              postal_code: form.postal_code,
              city: form.city,
              country: form.country,
            },
          },
          create_account: createAccount && !user,
          user_id: user?.id || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Fehler beim Checkout');
      if (data.url) window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
      setLoading(false);
    }
  };

  // ── No cart ────────────────────────────────────────────────────────────────
  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="w-12 h-12 text-stone-300 mx-auto mb-4" />
          <p className="text-slate-500 mb-4">Dein Warenkorb ist leer.</p>
          <Link href={WP_SHOP} className="text-sm text-slate-500 hover:text-slate-800 flex items-center gap-1 justify-center">
            <ArrowLeft className="w-3.5 h-3.5" /> Zurück zum Shop
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-5xl mx-auto px-6 py-12">

        {/* Header */}
        <div className="mb-8">
          <Link href={WP_SHOP} className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 transition mb-5">
            <ArrowLeft className="w-3.5 h-3.5" /> Zurück zum Shop
          </Link>
          <h1 className="text-2xl font-serif text-slate-900">Kasse</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-5 gap-8">

            {/* ── Left: Form ────────────────────────────────────────────── */}
            <div className="lg:col-span-3 space-y-6">

              {/* Account info */}
              <div className="bg-white rounded-2xl border border-stone-100 p-6">
                <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-400" /> Kontaktdaten
                </h2>

                {user ? (
                  <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100 mb-4">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-emerald-800">Angemeldet als {user.email}</p>
                      <Link href="/dashboard/settings" className="text-xs text-emerald-600 hover:underline">
                        Adresse im Profil bearbeiten
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="mb-4">
                    <label className={labelCls}>E-Mail *</label>
                    <input
                      name="email" type="email" required value={form.email}
                      onChange={handleChange} className={inputCls}
                      placeholder="deine@email.ch"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Vorname *</label>
                    <input name="first_name" required value={form.first_name} onChange={handleChange} className={inputCls} placeholder="Lara" />
                  </div>
                  <div>
                    <label className={labelCls}>Nachname *</label>
                    <input name="last_name" required value={form.last_name} onChange={handleChange} className={inputCls} placeholder="Müller" />
                  </div>
                </div>
              </div>

              {/* Shipping address */}
              <div className="bg-white rounded-2xl border border-stone-100 p-6">
                <h2 className="font-semibold text-slate-900 mb-4">Lieferadresse</h2>
                <div className="space-y-3">
                  <div>
                    <label className={labelCls}>Strasse & Nr. *</label>
                    <input name="address_line1" required value={form.address_line1} onChange={handleChange} className={inputCls} placeholder="Musterstrasse 12" />
                  </div>
                  <div>
                    <label className={labelCls}>Adresszusatz</label>
                    <input name="address_line2" value={form.address_line2} onChange={handleChange} className={inputCls} placeholder="c/o, Postfach…" />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className={labelCls}>PLZ *</label>
                      <input name="postal_code" required value={form.postal_code} onChange={handleChange} className={inputCls} placeholder="3000" />
                    </div>
                    <div className="col-span-2">
                      <label className={labelCls}>Ort *</label>
                      <input name="city" required value={form.city} onChange={handleChange} className={inputCls} placeholder="Bern" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Land</label>
                      <select name="country" value={form.country} onChange={handleChange} className={inputCls}>
                        <option value="CH">🇨🇭 Schweiz</option>
                        <option value="DE">🇩🇪 Deutschland</option>
                        <option value="AT">🇦🇹 Österreich</option>
                        <option value="LI">🇱🇮 Liechtenstein</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Telefon</label>
                      <input name="phone" value={form.phone} onChange={handleChange} className={inputCls} placeholder="+41 79 123 45 67" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Create account — only show if not logged in */}
              {!user && (
                <div className="bg-white rounded-2xl border border-stone-100 p-5">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={createAccount}
                      onChange={e => setCreateAccount(e.target.checked)}
                      className="w-4 h-4 mt-0.5 rounded border-stone-300 accent-slate-800"
                    />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Kundenkonto erstellen</p>
                      <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                        Mit einem Konto kannst du deine Gedenkseiten verwalten, Medaillons verbinden
                        und Bestellungen einsehen. Du erhältst einen Aktivierungslink per E-Mail.
                      </p>
                    </div>
                  </label>
                </div>
              )}
            </div>

            {/* ── Right: Order summary ───────────────────────────────────── */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl border border-stone-100 p-6 sticky top-6">
                <h2 className="font-semibold text-slate-900 mb-4">Bestellung</h2>

                <div className="space-y-3 mb-5">
                  {cart.items.map(item => (
                    <div key={item.key} className="flex gap-3 items-center">
                      {item.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.image_url} alt={item.title} className="w-12 h-12 object-cover rounded-lg flex-shrink-0" />
                      ) : (
                        <div className="w-12 h-12 bg-stone-100 rounded-lg flex-shrink-0 flex items-center justify-center">
                          <ShoppingBag className="w-5 h-5 text-stone-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{item.title}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {item.purchase_type === 'gift' ? (
                            <span className="text-[10px] text-violet-600 font-semibold flex items-center gap-0.5">
                              <Gift className="w-2.5 h-2.5" /> Geschenk
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                              <User className="w-2.5 h-2.5" /> Für mich
                            </span>
                          )}
                          <span className="text-[10px] text-slate-300">· {item.quantity}×</span>
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-slate-900 flex-shrink-0">
                        {formatChf(Number(item.price) * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="border-t border-stone-100 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Zwischensumme</span>
                    <span className="font-semibold">{formatChf(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Versand</span>
                    <span>Wird berechnet</span>
                  </div>
                </div>

                {error && (
                  <p className="text-xs text-red-600 bg-red-50 rounded-xl p-3 mt-4">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-5 flex items-center justify-center gap-2 bg-slate-900 text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-slate-800 transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Weiterleitung zu Stripe…</>
                  ) : (
                    <>Zur Kasse <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>

                <div className="flex items-center justify-center gap-1.5 mt-3">
                  <Lock className="w-3 h-3 text-slate-300" />
                  <p className="text-xs text-slate-400">Sicherer Checkout via Stripe · SSL</p>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
