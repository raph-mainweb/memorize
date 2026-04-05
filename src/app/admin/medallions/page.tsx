import { createAdminClient } from '@/utils/supabase/admin';
import MedaillonManager from './MedaillonManager';

export default async function MedallionsAdminPage() {
  const db = createAdminClient();

  const [{ data: products }, { data: codes }, { count: totalAvailable }] = await Promise.all([
    db.from('products').select('id, title').order('title'),
    db.from('medallion_codes')
      .select('id, code, qr_url, batch, status, production_status, inventory_status, serial_number, notes, created_at, exported_at, produced_at, connected_at, shipped_at, products(title)')
      .order('created_at', { ascending: false })
      .limit(500),
    db.from('medallion_codes').select('*', { count: 'exact', head: true }).eq('inventory_status', 'in_stock'),
  ]);

  return (
    <div className="p-8 md:p-12">
      <header className="mb-10 flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-serif text-slate-900">QR-Codes & Lager</h1>
          <p className="text-slate-500 mt-2 font-light">
            <span className="font-semibold text-slate-800">{totalAvailable || 0}</span> Medaillons aktuell im Lager · Gesamtbestand: {codes?.length || 0}
          </p>
        </div>
      </header>

      <MedaillonManager
        products={products || []}
        initialCodes={(codes || []) as unknown as Parameters<typeof MedaillonManager>[0]['initialCodes']}
        totalAvailable={totalAvailable || 0}
      />
    </div>
  );
}
