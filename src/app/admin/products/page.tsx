import { createAdminClient } from '@/utils/supabase/admin';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export default async function ProductsPage() {
  const supabase = createAdminClient();
  const { data: products } = await supabase
    .from('products')
    .select('id, title, price_in_cents, is_active, short_description')
    .order('created_at', { ascending: false });

  return (
    <div className="p-8 md:p-12">
      <header className="mb-10 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-serif text-slate-900">Produkte</h1>
          <p className="text-slate-500 mt-2">Medaillon-Varianten und Designs verwalten.</p>
        </div>
        <Link
          href="/admin/products/neu"
          className="flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-xl text-sm font-semibold hover:bg-slate-800 transition"
        >
          <Plus className="w-4 h-4" /> Neues Produkt
        </Link>
      </header>

      <div className="space-y-4">
        {products && products.length > 0 ? (
          products.map(p => (
            <Link
              key={p.id}
              href={`/admin/products/${p.id}`}
              className="flex items-center justify-between bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition group"
            >
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-semibold text-slate-900 group-hover:text-sage-700 transition">{p.title}</h3>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${p.is_active ? 'bg-sage-100 text-sage-800' : 'bg-stone-100 text-stone-600'}`}>
                    {p.is_active ? 'Aktiv' : 'Inaktiv'}
                  </span>
                </div>
                {p.short_description && (
                  <p className="text-sm text-slate-500">{p.short_description}</p>
                )}
              </div>
              <div className="text-right flex-shrink-0 ml-6">
                <p className="font-semibold text-slate-900 text-lg">CHF {((p.price_in_cents || 0) / 100).toFixed(2)}</p>
                <p className="text-xs text-slate-400 mt-0.5">Bearbeiten →</p>
              </div>
            </Link>
          ))
        ) : (
          <div className="p-16 text-center text-slate-400 border border-dashed border-slate-200 rounded-3xl bg-white">
            <p className="mb-4">Noch keine Produkte angelegt.</p>
            <Link href="/admin/products/neu" className="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-800 transition">
              <Plus className="w-4 h-4" /> Erstes Produkt anlegen
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
