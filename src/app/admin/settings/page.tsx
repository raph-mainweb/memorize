import { createAdminClient } from '@/utils/supabase/admin';
import { revalidatePath } from 'next/cache';
import BrandingClient from './BrandingClient';

export default async function SettingsPage() {
  const supabase = createAdminClient();

  // Fetch unlock price
  const { data: priceSetting } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', 'unlock_price')
    .maybeSingle();

  // Fetch logo
  const { data: logoSetting } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', 'brand_logo')
    .maybeSingle();

  const currentAmount  = priceSetting?.value?.amount  || 4900;
  const currentDisplay = currentAmount / 100;
  const currentLogoUrl  = logoSetting?.value?.url  || '';

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

  return (
    <div className="p-8 md:p-12">
      <header className="mb-12">
        <h1 className="text-4xl font-heading font-medium text-slate-900">Einstellungen</h1>
        <p className="text-slate-500 mt-2 font-sans">Globale Systemparameter, Preise &amp; Branding anpassen.</p>
      </header>

      <div className="space-y-8">

        {/* ─── Branding: Logo + Colors (Client Component) ─────────── */}
        <BrandingClient
          initialLogoUrl={currentLogoUrl}
        />

        {/* ─── Price Setting (Server Action) ───────────────────────── */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 max-w-2xl">
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
              <p className="text-xs text-slate-400 mt-2">Wird direkt im Stripe Checkout für die Freischaltung berechnet.</p>
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
