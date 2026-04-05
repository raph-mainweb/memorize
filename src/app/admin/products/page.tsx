import { createAdminClient } from '@/utils/supabase/admin';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';

export default async function ProductsPage() {
  const supabase = createAdminClient();
  const { data: products } = await supabase.from('products').select('*').order('created_at', { ascending: false });

  async function createProduct(formData: FormData) {
    'use server'
    const title = formData.get('title') as string;
    const priceRaw = Number(formData.get('price'));
    const priceInCents = priceRaw * 100;

    const db = createAdminClient();
    await db.from('products').insert({
      title,
      price_in_cents: priceInCents,
      description: 'Kurzbeschreibung...',
    });
    revalidatePath('/admin/products');
  }

  return (
    <div className="p-8 md:p-12">
      <header className="mb-12 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-serif text-slate-900">Medaillon Designs</h1>
          <p className="text-slate-500 mt-2">Physische Produkte und Varianten verwalten.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Produkt hinzufügen Modal/Form */}
        <div className="lg:col-span-1 bg-white p-6 rounded-3xl shadow-sm border border-slate-200 h-fit">
          <h2 className="font-serif text-xl mb-4">Neues Design</h2>
          <form action={createProduct} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Titel</label>
              <input name="title" required className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-sage-500" placeholder="z.B. Premium Messing" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Preis (CHF)</label>
              <input name="price" type="number" step="0.05" required className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-sage-500" placeholder="z.B. 99.00" />
            </div>
            <button type="submit" className="w-full bg-slate-900 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-slate-800 transition">Design Anlegen</button>
          </form>
        </div>

        {/* Liste */}
        <div className="lg:col-span-2 space-y-4">
          {products?.map(p => (
            <div key={p.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800">{p.title}</h3>
                <p className="text-sm text-slate-500 mt-1">{(p.price_in_cents / 100).toFixed(2)} CHF</p>
              </div>
              <button className="text-sm text-sage-600 font-medium hover:text-sage-700">Bearbeiten</button>
            </div>
          ))}
          {(!products || products.length === 0) && (
             <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-3xl">Keine Designs angelegt.</div>
          )}
        </div>

      </div>
    </div>
  );
}
