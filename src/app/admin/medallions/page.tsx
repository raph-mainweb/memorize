import { createAdminClient } from '@/utils/supabase/admin';
import MedaillonManager from './MedaillonManager';

export default async function MedallionsAdminPage() {
  const db = createAdminClient();

  // Fetch products (always safe — no new columns)
  const { data: products } = await db
    .from('products')
    .select('id, title')
    .order('title');

  // Fetch all codes — use '*' so PostgREST schema cache misses don't silently drop rows
  const { data: codes, error: codesError } = await db
    .from('medallion_codes')
    .select('*, products(title)')
    .order('created_at', { ascending: false })
    .limit(500);

  if (codesError) {
    console.error('[Admin/Medallions] Failed to fetch codes:', codesError.message);
  }

  // Count available stock using legacy 'status' field (always existed — safe)
  const { count: totalAvailable } = await db
    .from('medallion_codes')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'available');



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
