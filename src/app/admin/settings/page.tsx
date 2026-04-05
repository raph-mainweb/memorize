import { createAdminClient } from '@/utils/supabase/admin';
import { revalidatePath } from 'next/cache';

export default async function SettingsPage() {
  const supabase = createAdminClient();
  
  // Safe fetch with fallback
  const { data: setting, error } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', 'unlock_price')
    .single();
    
  if (error && error.code !== 'PGRST116') {
     console.error("Error fetching system settings:", error);
  }
  
  const currentAmount = setting?.value?.amount || 4900;
  const currentDisplay = currentAmount / 100;

  async function updatePrice(formData: FormData) {
    'use server'
    const newPrice = Number(formData.get('price'));
    const amountInCents = newPrice * 100;
    
    const db = createAdminClient();
    
    const valuePayload = { amount: amountInCents, currency: 'chf', name: 'Gedenkseite Freischaltung' };
    
    const { error: updateError } = await db.from('system_settings').update({ value: valuePayload }).eq('key', 'unlock_price');
    if (updateError) {
         // Fallback to insert just in case
         await db.from('system_settings').insert({ key: 'unlock_price', value: valuePayload });
    }
    
    revalidatePath('/admin/settings');
  }

  return (
    <div className="p-8 md:p-12">
      <header className="mb-12">
        <h1 className="text-4xl font-serif text-slate-900">Einstellungen</h1>
        <p className="text-slate-500 mt-2">Globale Systemparameter & Preise anpassen.</p>
      </header>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 max-w-2xl">
        <h2 className="text-xl font-serif text-slate-800 mb-6">Standard Seitenfreischaltung</h2>
        
        <form action={updatePrice} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Preis (in CHF)</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500 font-medium">CHF</span>
              <input 
                type="number" 
                name="price"
                step="0.05"
                defaultValue={currentDisplay}
                className="w-full pl-14 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-sage-500 focus:ring-1 focus:ring-sage-500 text-slate-800 bg-stone-50"
                required
              />
            </div>
            <p className="text-xs text-slate-400 mt-2">Dieser Preis wird direkt im Checkout für die Freischaltung einer Gedenkseite ohne Medaillon berechnet.</p>
          </div>
          
          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button 
              type="submit" 
              className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl text-sm font-medium transition"
            >
              Preis Speichern
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
