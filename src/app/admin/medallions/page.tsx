import { createAdminClient } from '@/utils/supabase/admin';
import { revalidatePath } from 'next/cache';

export default async function MedallionsPage() {
  const supabase = createAdminClient();
  
  const { data: products } = await supabase.from('products').select('id, title');
  const { data: codes } = await supabase.from('medallion_codes').select('*, products(title)').order('created_at', { ascending: false }).limit(100);
  const { count: totalCodes } = await supabase.from('medallion_codes').select('*', { count: 'exact', head: true }).eq('status', 'available');

  async function uploadCodes(formData: FormData) {
    'use server'
    const productId = formData.get('product_id') as string;
    const codesRaw = formData.get('codes') as string;
    
    // Parse codes: split by comma, newline, or space, filter empty strings
    const codeArray = codesRaw.split(/[\n, ]+/).map(c => c.trim()).filter(c => c.length > 0);
    
    if (codeArray.length === 0) return;

    const db = createAdminClient();
    const payload = codeArray.map(code => ({
      code,
      product_id: productId !== 'unassigned' ? productId : null,
      status: 'available',
      batch: `batch-${new Date().toISOString().split('T')[0]}`
    }));

    // Insert many
    await db.from('medallion_codes').insert(payload);
    revalidatePath('/admin/medallions');
  }

  return (
    <div className="p-8 md:p-12">
      <header className="mb-12 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-serif text-slate-900">QR-Codes & Lager</h1>
          <p className="text-slate-500 mt-2">Aktuell {totalCodes || 0} Medaillons im Lager bereit für den Versand.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Bulk Upload Modal/Form */}
        <div className="lg:col-span-1 bg-white p-6 rounded-3xl shadow-sm border border-slate-200 h-fit">
          <h2 className="font-serif text-xl mb-4">Codes Hinzufügen (Wareneingang)</h2>
          <p className="text-sm text-slate-500 mb-6">Wenn du eine neue Lieferung an Medaillons erhältst, trage deren QR-Codes hier ein.</p>
          <form action={uploadCodes} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Design / Produkt</label>
              <select name="product_id" className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-sage-500">
                <option value="unassigned">Keines (Flexibel)</option>
                {products?.map(p => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Codes (Einer pro Zeile oder Komma)</label>
              <textarea 
                name="codes" 
                rows={6} 
                required 
                className="w-full px-4 py-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-sage-500 font-mono text-xs" 
                placeholder="A1B2&#10;X9Y8&#10;C3D4" 
              />
            </div>
            <button type="submit" className="w-full bg-slate-900 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-slate-800 transition">In den Bestand aufnehmen</button>
          </form>
        </div>

        {/* Liste */}
        <div className="lg:col-span-2">
           <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
             <div className="px-6 py-4 border-b border-slate-100 bg-stone-50/50">
               <h3 className="font-medium text-slate-800">Letzte 100 Codes</h3>
             </div>
             <div className="overflow-x-auto">
               <table className="w-full text-left text-sm">
                 <thead className="bg-[#faf9f6] border-b border-slate-100 text-[10px] uppercase tracking-widest text-slate-400">
                   <tr>
                     <th className="px-6 py-3 font-semibold">Code</th>
                     <th className="px-6 py-3 font-semibold">Design</th>
                     <th className="px-6 py-3 font-semibold">Status</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                   {codes?.map(c => (
                     <tr key={c.id} className="hover:bg-slate-50">
                       <td className="px-6 py-3 font-mono text-xs">{c.code}</td>
                       <td className="px-6 py-3 text-slate-600">{(c as { products?: { title: string } | null }).products?.title || 'Generisch'}</td>
                       <td className="px-6 py-3">
                         {c.status === 'available' ? (
                            <span className="px-2 py-1 bg-sage-50 text-sage-700 rounded-md text-xs font-bold">Lager</span>
                         ) : c.status === 'assigned' ? (
                            <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded-md text-xs font-bold">In Bestellung</span>
                         ) : (
                            <span className="px-2 py-1 bg-green-50 text-green-700 rounded-md text-xs font-bold">{c.status}</span>
                         )}
                       </td>
                     </tr>
                   ))}
                   {(!codes || codes.length === 0) && (
                      <tr><td colSpan={3} className="px-6 py-8 text-center text-slate-400">Keine Codes vorhanden.</td></tr>
                   )}
                 </tbody>
               </table>
             </div>
           </div>
        </div>

      </div>
    </div>
  );
}
