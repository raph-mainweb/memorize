import { createAdminClient } from '@/utils/supabase/admin';
import Link from 'next/link';
import { Package, ShieldCheck } from 'lucide-react';

export const metadata = {
  title: 'Medaillon Varianten | Nachklang CH',
  description: 'Wählen Sie das passende QR-Medaillon für eine würdevolle Gestaltung.',
};

export default async function MedallionsPage() {
  const supabase = createAdminClient();
  
  // Fetch active products
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('price', { ascending: true });

  return (
    <div className="flex-grow flex flex-col items-center bg-stone-50 py-24 pb-32">
      <div className="max-w-4xl w-full px-6 text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-serif text-slate-900 mb-6 tracking-tight">Unsere Medaillons</h1>
        <p className="text-slate-500 text-lg md:text-xl font-light leading-relaxed max-w-2xl mx-auto">
          Physische Berührungspunkte für digitale Erinnerungen. Witterungsbeständig, edel und in verschiedenen Materialien verfügbar.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl w-full px-6">
        {products && products.length > 0 ? (
          products.map(product => (
            <div key={product.id} className="bg-white rounded-3xl p-8 shadow-sm border border-stone-200 flex flex-col items-start hover:shadow-md transition">
              <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center mb-6">
                 <Package className="w-8 h-8 text-sage-600" />
              </div>
              <h3 className="text-2xl font-serif text-slate-900 mb-2">{product.title}</h3>
              <p className="text-slate-500 font-light mb-6 flex-grow">{product.description || 'Hochwertiges QR-Medaillon zur Verknüpfung mit der digitalen Gedenkseite.'}</p>
              <div className="w-full flex items-center justify-between border-t border-stone-100 pt-6 mt-auto">
                 <div className="flex flex-col">
                   <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Preis</span>
                   <span className="text-xl font-medium text-slate-900">CHF {product.price || '49.00'}</span>
                 </div>
                 <Link href="/dashboard/neu" className="text-sm bg-slate-900 text-white px-5 py-2.5 rounded-full hover:bg-slate-800 transition">
                   Erstellen
                 </Link>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-20 bg-white rounded-3xl border border-stone-200 shadow-sm">
            <ShieldCheck className="w-12 h-12 text-stone-300 mx-auto mb-4" />
            <h3 className="text-xl font-serif text-slate-800 mb-2">Noch keine Medaillons verfügbar</h3>
            <p className="text-slate-500">Der Betreiber hat noch keine Produkte im Admin-Dashboard erfasst.</p>
          </div>
        )}
      </div>
    </div>
  );
}
