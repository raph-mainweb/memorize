'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { X, Loader2, Plus, ChevronRight, FileHeart, LogIn, MapPin } from 'lucide-react';

interface Props {
  productId: string;
  productTitle: string;
  onClose: () => void;
}

interface Memorial {
  id: string;
  name: string;
  slug: string;
  is_live: boolean;
  type: string;
}

interface Address {
  first_name: string;
  last_name: string;
  address_line1: string;
  address_line2: string;
  postal_code: string;
  city: string;
  country: string;
  phone: string;
}

type Step = 'loading' | 'unauthenticated' | 'no-pages' | 'pick' | 'address' | 'checkout';

export default function MemorialPickerModal({ productId, productTitle, onClose }: Props) {
  const [step, setStep] = useState<Step>('loading');
  const [memorials, setMemorials] = useState<Memorial[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [addressError, setAddressError] = useState('');
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [address, setAddress] = useState<Address>({
    first_name: '', last_name: '', address_line1: '', address_line2: '',
    postal_code: '', city: '', country: 'CH', phone: '',
  });
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setStep('unauthenticated'); return; }

      // Load address from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, address_line1, address_line2, postal_code, city, country, phone')
        .eq('id', user.id)
        .single();

      if (profile) {
        setAddress({
          first_name: profile.first_name || '',
          last_name: profile.last_name || '',
          address_line1: profile.address_line1 || '',
          address_line2: profile.address_line2 || '',
          postal_code: profile.postal_code || '',
          city: profile.city || '',
          country: profile.country || 'CH',
          phone: profile.phone || '',
        });
      }

      const { data: pages } = await supabase
        .from('memorial_pages')
        .select('id, name, slug, is_live, type')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!pages || pages.length === 0) { setStep('no-pages'); }
      else { setMemorials(pages); setStep('pick'); }
    }
    init();
  }, []);

  function handleAddressChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setAddress(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleAddressNext() {
    if (!address.first_name || !address.last_name || !address.address_line1 || !address.postal_code || !address.city) {
      setAddressError('Bitte alle Pflichtfelder ausfüllen.');
      return;
    }
    setAddressError('');
    setIsSavingAddress(true);

    // Save address to profile
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('profiles').update({
        first_name: address.first_name,
        last_name: address.last_name,
        address_line1: address.address_line1,
        address_line2: address.address_line2,
        postal_code: address.postal_code,
        city: address.city,
        country: address.country,
        phone: address.phone,
      }).eq('id', user.id);
    }
    setIsSavingAddress(false);
    await handleCheckout();
  }

  async function handleCheckout() {
    if (!selected) return;
    setIsCheckingOut(true);

    const res = await fetch('/api/checkout/medallion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: productId,
        memorial_id: selected,
        shipping: {
          name: `${address.first_name} ${address.last_name}`.trim(),
          address: {
            line1: address.address_line1,
            line2: address.address_line2 || undefined,
            postal_code: address.postal_code,
            city: address.city,
            country: address.country,
          },
          phone: address.phone || undefined,
        },
      }),
    });

    const data = await res.json();
    if (data.url) { window.location.href = data.url; }
    else { console.error('Checkout error:', data.error); setIsCheckingOut(false); }
  }

  const inputCls = 'w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-slate-400 transition';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100">
          <div>
            <h2 className="font-serif text-xl text-slate-900">Medaillon bestellen</h2>
            <p className="text-xs text-slate-500 mt-0.5">{productTitle}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-stone-100 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step indicator */}
        {(step === 'pick' || step === 'address') && (
          <div className="flex border-b border-stone-100">
            {['Gedenkseite', 'Lieferadresse'].map((label, i) => {
              const active = (i === 0 && step === 'pick') || (i === 1 && step === 'address');
              const done = i === 0 && step === 'address';
              return (
                <div key={i} className={`flex-1 py-2.5 text-center text-xs font-semibold tracking-wide transition ${active ? 'text-slate-900 border-b-2 border-slate-900' : done ? 'text-slate-400' : 'text-slate-300'}`}>
                  {i + 1}. {label}
                </div>
              );
            })}
          </div>
        )}

        {/* Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto">

          {step === 'loading' && (
            <div className="py-12 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          )}

          {step === 'unauthenticated' && (
            <div className="py-8 text-center">
              <LogIn className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="font-medium text-slate-800 mb-1">Anmeldung erforderlich</h3>
              <p className="text-sm text-slate-500 mb-6">Bitte melde dich an, um ein Medaillon zu bestellen.</p>
              <button onClick={() => router.push(`/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`)} className="w-full bg-slate-900 text-white py-3 rounded-xl font-medium text-sm hover:bg-slate-800 transition">
                Anmelden / Registrieren
              </button>
            </div>
          )}

          {step === 'no-pages' && (
            <div className="py-8 text-center">
              <FileHeart className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="font-medium text-slate-800 mb-1">Noch keine Gedenkseite</h3>
              <p className="text-sm text-slate-500 mb-6">Das Medaillon braucht eine Gedenkseite. Erstelle zuerst eine Seite (kostenlos, keine Kreditkarte nötig).</p>
              <button onClick={() => router.push('/dashboard/neu')} className="w-full bg-slate-900 text-white py-3 rounded-xl font-medium text-sm hover:bg-slate-800 transition flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> Gedenkseite erstellen
              </button>
            </div>
          )}

          {/* STEP 1: Pick memorial */}
          {step === 'pick' && (
            <div>
              <p className="text-sm text-slate-600 mb-4">Wähle die Gedenkseite, mit der das Medaillon verbunden werden soll.</p>
              <div className="space-y-2 mb-4 max-h-52 overflow-y-auto pr-1">
                {memorials.map(m => (
                  <button key={m.id} type="button" onClick={() => setSelected(m.id)}
                    className={`w-full text-left px-4 py-3.5 rounded-xl border-2 transition flex items-center gap-3 ${selected === m.id ? 'border-slate-900 bg-stone-50' : 'border-stone-200 hover:border-slate-400'}`}>
                    <div className="flex-grow min-w-0">
                      <p className="font-medium text-slate-900 truncate">{m.name || 'Unbenannte Seite'}</p>
                      <p className="text-xs text-slate-400 mt-0.5">/gedenken/{m.slug}</p>
                    </div>
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full flex-shrink-0 ${m.is_live ? 'bg-sage-100 text-sage-800' : 'bg-stone-100 text-stone-600'}`}>
                      {m.is_live ? 'Live' : 'Entwurf'}
                    </span>
                    {selected === m.id && <ChevronRight className="w-4 h-4 text-slate-900 flex-shrink-0" />}
                  </button>
                ))}
              </div>
              <button type="button" onClick={() => router.push('/dashboard/neu')} className="w-full text-sm text-slate-500 py-3 border border-dashed border-stone-200 rounded-xl hover:border-slate-400 hover:text-slate-700 flex items-center justify-center gap-2 transition mb-5">
                <Plus className="w-4 h-4" /> Neue Gedenkseite erstellen
              </button>
              <button onClick={() => selected && setStep('address')} disabled={!selected}
                className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-slate-800 transition flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
                Weiter zur Lieferadresse <ChevronRight className="w-4 h-4" />
              </button>
              {!selected && <p className="text-xs text-center text-slate-400 mt-2">Bitte erst eine Gedenkseite auswählen</p>}
            </div>
          )}

          {/* STEP 2: Shipping address */}
          {step === 'address' && (
            <div>
              <div className="flex items-center gap-2 mb-5">
                <MapPin className="w-4 h-4 text-slate-400" />
                <p className="text-sm text-slate-600">Lieferadresse für das Medaillon</p>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Vorname *</label>
                    <input name="first_name" value={address.first_name} onChange={handleAddressChange} className={inputCls} placeholder="Lara" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Nachname *</label>
                    <input name="last_name" value={address.last_name} onChange={handleAddressChange} className={inputCls} placeholder="Müller" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Strasse & Nr. *</label>
                  <input name="address_line1" value={address.address_line1} onChange={handleAddressChange} className={inputCls} placeholder="Musterstrasse 12" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Adresszusatz</label>
                  <input name="address_line2" value={address.address_line2} onChange={handleAddressChange} className={inputCls} placeholder="c/o, Postfach…" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">PLZ *</label>
                    <input name="postal_code" value={address.postal_code} onChange={handleAddressChange} className={inputCls} placeholder="3000" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Ort *</label>
                    <input name="city" value={address.city} onChange={handleAddressChange} className={inputCls} placeholder="Bern" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Land *</label>
                    <select name="country" value={address.country} onChange={handleAddressChange} className={inputCls}>
                      <option value="CH">🇨🇭 Schweiz</option>
                      <option value="DE">🇩🇪 Deutschland</option>
                      <option value="AT">🇦🇹 Österreich</option>
                      <option value="LI">🇱🇮 Liechtenstein</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Telefon</label>
                    <input name="phone" value={address.phone} onChange={handleAddressChange} className={inputCls} placeholder="+41 79 123 45 67" />
                  </div>
                </div>
              </div>
              {addressError && <p className="text-xs text-red-600 mt-3 font-medium">{addressError}</p>}
              <p className="text-xs text-slate-400 mt-3">* Pflichtfelder. Adresse wird in deinem Profil gespeichert.</p>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setStep('pick')} className="px-4 py-3 border border-stone-200 rounded-xl text-sm text-slate-600 hover:bg-stone-50 transition">
                  ← Zurück
                </button>
                <button onClick={handleAddressNext} disabled={isCheckingOut || isSavingAddress}
                  className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-semibold text-sm hover:bg-slate-800 transition flex items-center justify-center gap-2 disabled:opacity-40">
                  {(isCheckingOut || isSavingAddress) ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {isCheckingOut ? 'Weiterleitung zu Stripe...' : 'Zur Kasse →'}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
