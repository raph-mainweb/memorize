import { createAdminClient } from '@/utils/supabase/admin';
import { revalidatePath } from 'next/cache';
import Image from 'next/image';
import { ImageIcon } from 'lucide-react';

export default async function SettingsPage() {
  const supabase = createAdminClient();

  // Fetch unlock price
  const { data: priceSetting, error: priceError } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', 'unlock_price')
    .maybeSingle();

  if (priceError && priceError.code !== 'PGRST116') {
    console.error('Error fetching price setting:', priceError);
  }

  // Fetch logo setting
  const { data: logoSetting } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', 'brand_logo')
    .maybeSingle();

  const currentAmount  = priceSetting?.value?.amount || 4900;
  const currentDisplay = currentAmount / 100;
  const currentLogoUrl  = logoSetting?.value?.url  || '';
  const currentLogoText = logoSetting?.value?.text || 'Nachklang';

  // Server action: update price
  async function updatePrice(formData: FormData) {
    'use server';
    const newPrice = Number(formData.get('price'));
    const amountInCents = newPrice * 100;
    const db = createAdminClient();
    const valuePayload = { amount: amountInCents, currency: 'chf', name: 'Gedenkseite Freischaltung' };
    const { error } = await db.from('system_settings').update({ value: valuePayload }).eq('key', 'unlock_price');
    if (error) await db.from('system_settings').insert({ key: 'unlock_price', value: valuePayload });
    revalidatePath('/admin/settings');
  }

  // Server action: update logo
  async function updateLogo(formData: FormData) {
    'use server';
    const url  = (formData.get('logo_url')  as string)?.trim() || null;
    const text = (formData.get('logo_text') as string)?.trim() || 'Nachklang';
    const db = createAdminClient();
    const valuePayload = { url, text };
    const { error } = await db.from('system_settings').update({ value: valuePayload }).eq('key', 'brand_logo');
    if (error) await db.from('system_settings').insert({ key: 'brand_logo', value: valuePayload });
    revalidatePath('/admin/settings');
    revalidatePath('/');
  }

  return (
    <div className="p-8 md:p-12">
      <header className="mb-12">
        <h1 className="text-4xl font-heading font-medium text-slate-900">Einstellungen</h1>
        <p className="text-slate-500 mt-2 font-sans">Globale Systemparameter, Preise & Branding anpassen.</p>
      </header>

      <div className="space-y-8 max-w-2xl">

        {/* ─── Logo Setting ─────────────────────────────────────────── */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-heading font-medium text-slate-800 mb-1">Logo & Markenname</h2>
          <p className="text-sm text-slate-400 mb-6">Das Logo wird in der Navigation und überall auf der Plattform angezeigt.</p>

          {/* Preview */}
          <div className="mb-6 p-4 bg-stone-50 rounded-2xl border border-slate-100 flex items-center gap-4">
            {currentLogoUrl ? (
              <Image
                src={currentLogoUrl}
                alt="Logo Vorschau"
                width={180}
                height={50}
                className="h-10 w-auto object-contain"
              />
            ) : (
              <div className="flex items-center gap-2 text-slate-400">
                <ImageIcon className="w-5 h-5" />
                <span className="text-sm">Kein Logo hinterlegt — Textfallback: <strong className="text-slate-600">{currentLogoText}</strong></span>
              </div>
            )}
          </div>

          <form action={updateLogo} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Logo-URL</label>
              <input
                type="url"
                name="logo_url"
                defaultValue={currentLogoUrl}
                placeholder="https://dein-cdn.com/logo.svg"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 bg-stone-50"
              />
              <p className="text-xs text-slate-400 mt-1.5">
                Direkte URL zu deinem Logo (SVG oder PNG empfohlen). Leer lassen für Textfallback.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Markenname (Textfallback)</label>
              <input
                type="text"
                name="logo_text"
                defaultValue={currentLogoText}
                placeholder="Nachklang"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 bg-stone-50"
              />
              <p className="text-xs text-slate-400 mt-1.5">
                Wird angezeigt wenn kein Logo-Bild hinterlegt ist.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                className="bg-brand-500 hover:bg-brand-600 text-white px-6 py-3 rounded-xl text-sm font-medium transition"
              >
                Logo speichern
              </button>
            </div>
          </form>
        </div>

        {/* ─── Price Setting ─────────────────────────────────────────── */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-heading font-medium text-slate-800 mb-1">Standard Seitenfreischaltung</h2>
          <p className="text-sm text-slate-400 mb-6">Preis für die Freischaltung einer Gedenkseite ohne Medaillon.</p>

          <form action={updatePrice} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Preis (in CHF)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500 font-medium">CHF</span>
                <input
                  type="number"
                  name="price"
                  step="0.05"
                  defaultValue={currentDisplay}
                  className="w-full pl-14 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 text-slate-800 bg-stone-50"
                  required
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                className="bg-brand-500 hover:bg-brand-600 text-white px-6 py-3 rounded-xl text-sm font-medium transition"
              >
                Preis speichern
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
