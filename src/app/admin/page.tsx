import { createAdminClient } from '@/utils/supabase/admin';

export default async function AdminDashboard() {
  const supabase = createAdminClient(); // Bypasses RLS

  // Fetch KPI Data
  const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
  const { count: memorialCount } = await supabase.from('memorial_pages').select('*', { count: 'exact', head: true });
  const { count: stockCount } = await supabase.from('medallion_codes').select('*', { count: 'exact', head: true }).eq('inventory_status', 'in_stock');

  const { data: recentOrders } = await supabase
    .from('medallion_orders')
    .select('id, created_at, tracking_number, user_id')
    .order('created_at', { ascending: false })
    .limit(5);

  return (
    <div className="p-8 md:p-12">
      <header className="mb-12">
        <h1 className="text-4xl font-serif text-slate-900">Control Center</h1>
        <p className="text-slate-500 mt-2">Nachklang CH System-Übersicht & Reporting</p>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <h3 className="text-sm font-medium text-slate-500 mb-1">Registrierte Nutzer</h3>
          <p className="text-4xl font-serif text-slate-900">{userCount || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <h3 className="text-sm font-medium text-slate-500 mb-1">Gedenkseiten gesamt</h3>
          <p className="text-4xl font-serif text-slate-900">{memorialCount || 0}</p>
        </div>
        <div className={`p-6 rounded-3xl shadow-sm border ${stockCount !== null && stockCount < 10 ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}>
          <h3 className={`text-sm font-medium mb-1 ${stockCount !== null && stockCount < 10 ? 'text-red-700' : 'text-slate-500'}`}>Freie Medaillons (Stock)</h3>
          <p className={`text-4xl font-serif ${stockCount !== null && stockCount < 10 ? 'text-red-600' : 'text-sage-600'}`}>
            {stockCount || 0}
          </p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 opacity-70">
          <h3 className="text-sm font-medium text-slate-500 mb-1">Umsatz (Dieser Monat)</h3>
          <p className="text-4xl font-serif text-slate-900">CHF ---</p>
        </div>
      </div>

      {/* Shipping / Orders Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-stone-50/50">
           <h2 className="font-serif text-xl text-slate-900">Aktuelle Bestellungen (Versand)</h2>
           <a href="/admin/orders" className="text-sm text-sage-600 hover:text-sage-700 font-medium">Alle ansehen</a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-[#faf9f6] border-b border-slate-100 text-[10px] uppercase tracking-widest text-slate-400">
              <tr>
                <th className="px-8 py-5 font-semibold">Bestelldatum</th>
                <th className="px-8 py-5 font-semibold">Order ID</th>
                <th className="px-8 py-5 font-semibold">Nutzer</th>
                <th className="px-8 py-5 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentOrders && recentOrders.length > 0 ? recentOrders.map(order => (
                <tr key={order.id} className="hover:bg-slate-50 transition group cursor-pointer">
                  <td className="px-8 py-5 whitespace-nowrap text-slate-500 font-medium">
                    {new Date(order.created_at).toLocaleDateString('de-CH')}
                  </td>
                  <td className="px-8 py-5 font-mono text-xs text-slate-400 group-hover:text-sage-600 transition">
                    {order.id.split('-')[0]}
                  </td>
                  <td className="px-8 py-5 truncate max-w-[200px] font-medium text-slate-700">
                    Datenschutz-Ansicht
                  </td>
                  <td className="px-8 py-5">
                    {order.tracking_number ? (
                      <span className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-bold tracking-wide">Versendet</span>
                    ) : (
                      <span className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-xs font-bold tracking-wide">Ausstehend</span>
                    )}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="px-8 py-16 text-center text-slate-400">Keine offenen Medaillon-Bestellungen in der Datenbank gefunden.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
