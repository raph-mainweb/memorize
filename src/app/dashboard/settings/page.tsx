import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import AddressSettingsForm from './AddressSettingsForm';

export const metadata = { title: 'Einstellungen | Nachklang' };

export default async function DashboardSettingsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name, address_line1, address_line2, postal_code, city, country, phone')
    .eq('id', user.id)
    .single();

  return (
    <div className="flex-grow bg-stone-50">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-serif text-slate-900 mb-2">Einstellungen</h1>
        <p className="text-slate-500 text-sm mb-10">Dein Profil und deine Lieferadresse verwalten.</p>

        {/* Email (read-only) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">Konto</h2>
          <div>
            <label className="block text-xs text-slate-500 mb-1">E-Mail-Adresse</label>
            <p className="text-slate-800 font-medium">{user.email}</p>
          </div>
        </div>

        {/* Address form */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">Lieferadresse</h2>
          <p className="text-xs text-slate-400 mb-6">Wird automatisch beim Bestellvorgang vorausgefüllt.</p>
          <AddressSettingsForm profile={profile} userId={user.id} />
        </div>
      </div>
    </div>
  );
}
