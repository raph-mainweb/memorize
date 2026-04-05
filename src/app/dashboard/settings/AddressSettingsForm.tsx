'use client';

import { useState } from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';

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
  profile: Profile | null;
  userId: string;
}

export default function AddressSettingsForm({ profile }: Props) {
  const [form, setForm] = useState({
    first_name: profile?.first_name || '',
    last_name: profile?.last_name || '',
    address_line1: profile?.address_line1 || '',
    address_line2: profile?.address_line2 || '',
    postal_code: profile?.postal_code || '',
    city: profile?.city || '',
    country: profile?.country || 'CH',
    phone: profile?.phone || '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const inputCls = 'w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-slate-400 transition';

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError('');

    // Use API route with admin client — bypasses RLS reliably
    const res = await fetch('/api/profile/address', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    if (!res.ok || data.error) {
      setError(data.error || 'Fehler beim Speichern');
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Vorname</label>
          <input name="first_name" value={form.first_name} onChange={handleChange} className={inputCls} placeholder="Lara" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Nachname</label>
          <input name="last_name" value={form.last_name} onChange={handleChange} className={inputCls} placeholder="Müller" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Strasse & Nr.</label>
        <input name="address_line1" value={form.address_line1} onChange={handleChange} className={inputCls} placeholder="Musterstrasse 12" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Adresszusatz</label>
        <input name="address_line2" value={form.address_line2} onChange={handleChange} className={inputCls} placeholder="c/o, Postfach…" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">PLZ</label>
          <input name="postal_code" value={form.postal_code} onChange={handleChange} className={inputCls} placeholder="3000" />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Ort</label>
          <input name="city" value={form.city} onChange={handleChange} className={inputCls} placeholder="Bern" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Land</label>
          <select name="country" value={form.country} onChange={handleChange} className={inputCls}>
            <option value="CH">🇨🇭 Schweiz</option>
            <option value="DE">🇩🇪 Deutschland</option>
            <option value="AT">🇦🇹 Österreich</option>
            <option value="LI">🇱🇮 Liechtenstein</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Telefon</label>
          <input name="phone" value={form.phone} onChange={handleChange} className={inputCls} placeholder="+41 79 123 45 67" />
        </div>
      </div>

      {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

      <div className="flex items-center gap-4 pt-2">
        <button type="submit" disabled={saving}
          className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-800 transition flex items-center gap-2 disabled:opacity-40">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {saving ? 'Speichern…' : 'Adresse speichern'}
        </button>
        {saved && (
          <span className="flex items-center gap-1.5 text-emerald-700 text-sm font-medium">
            <CheckCircle2 className="w-4 h-4" /> Gespeichert
          </span>
        )}
      </div>
    </form>
  );
}
