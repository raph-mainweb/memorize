import { createAdminClient } from '@/utils/supabase/admin';
import { Users, Mail, MapPin, ShoppingBag, ShieldCheck } from 'lucide-react';

export const metadata = { title: 'Kunden | Nachklang Admin' };

export default async function AdminCustomersPage() {
  const db = createAdminClient();

  // Get all users from auth.users (includes email) via Admin API
  const { data: { users: authUsers } } = await db.auth.admin.listUsers({ perPage: 1000 });

  // Get profiles (without email — that's only in auth.users)
  const { data: profiles } = await db
    .from('profiles')
    .select('id, first_name, last_name, city, country, phone, created_at, is_admin');

  // Get order and page counts
  const { data: orderRows } = await db.from('medallion_orders').select('user_id');
  const { data: pageRows } = await db.from('memorial_pages').select('user_id, is_live');

  // Build lookup maps
  const profileMap: Record<string, { first_name?: string | null; last_name?: string | null; city?: string | null; country?: string | null; phone?: string | null; is_admin?: boolean | null }> = {};
  (profiles || []).forEach(p => { profileMap[p.id] = p; });

  const orderCounts: Record<string, number> = {};
  (orderRows || []).forEach((r: { user_id: string | null }) => {
    if (r.user_id) orderCounts[r.user_id] = (orderCounts[r.user_id] || 0) + 1;
  });
  const pageCounts: Record<string, { total: number; live: number }> = {};
  (pageRows || []).forEach((r: { user_id: string | null; is_live: boolean | null }) => {
    if (!r.user_id) return;
    if (!pageCounts[r.user_id]) pageCounts[r.user_id] = { total: 0, live: 0 };
    pageCounts[r.user_id].total++;
    if (r.is_live) pageCounts[r.user_id].live++;
  });

  const allUsers = authUsers || [];
  // Show only non-admin users, admins are filtered out
  const customers = allUsers.filter(u => !profileMap[u.id]?.is_admin);
  const totalOrders = Object.values(orderCounts).reduce((a, b) => a + b, 0);
  const totalLive = Object.values(pageCounts).reduce((a, b) => a + b.live, 0);

  return (
    <div className="p-8 md:p-12 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-serif text-slate-900 mb-1">Kunden</h1>
        <p className="text-slate-500 text-sm">{customers.length} Kunden · {allUsers.length} Nutzer gesamt</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {[
          { label: 'Kunden', value: customers.length, icon: Users, color: 'text-slate-700 bg-slate-50' },
          { label: 'Bestellungen', value: totalOrders, icon: ShoppingBag, color: 'text-violet-700 bg-violet-50' },
          { label: 'Live-Seiten', value: totalLive, icon: Mail, color: 'text-emerald-700 bg-emerald-50' },
          { label: 'Nutzer gesamt', value: allUsers.length, icon: Users, color: 'text-amber-700 bg-amber-50' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
              <s.icon className="w-4 h-4" />
            </div>
            <p className="text-2xl font-serif font-medium text-slate-900">{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[800px]">
            <thead className="bg-stone-50 border-b border-slate-100 text-[10px] uppercase tracking-widest text-slate-400">
              <tr>
                <th className="px-6 py-4">Nutzer</th>
                <th className="px-4 py-4">Adresse</th>
                <th className="px-4 py-4">Seiten</th>
                <th className="px-4 py-4">Bestellungen</th>
                <th className="px-4 py-4">Registriert</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customers.map(user => {
                const prof = profileMap[user.id] || {};
                const pages = pageCounts[user.id] || { total: 0, live: 0 };
                const orders = orderCounts[user.id] || 0;
                const fullName = [prof.first_name, prof.last_name].filter(Boolean).join(' ');
                const location = [prof.city, prof.country].filter(Boolean).join(', ');
                const isAdmin = !!prof.is_admin;
                const initial = (fullName?.[0] || user.email?.[0] || '?').toUpperCase();

                return (
                  <tr key={user.id} className="hover:bg-stone-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 text-sm font-semibold text-slate-600">
                          {initial}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-slate-900">
                              {fullName || <span className="text-slate-400 font-normal italic">Kein Name</span>}
                            </p>
                            {isAdmin && (
                              <span className="inline-flex items-center gap-1 text-[10px] bg-amber-50 text-amber-700 font-semibold px-1.5 py-0.5 rounded-full">
                                <ShieldCheck className="w-2.5 h-2.5" /> Admin
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-500">
                      {location ? (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-300" /> {location}
                        </span>
                      ) : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-700 font-medium">{pages.total}</span>
                        {pages.live > 0 && (
                          <span className="text-[10px] bg-emerald-50 text-emerald-700 font-semibold px-1.5 py-0.5 rounded-full">{pages.live} live</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {orders > 0 ? (
                        <span className="inline-flex items-center gap-1.5 bg-violet-50 text-violet-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                          <ShoppingBag className="w-3 h-3" /> {orders}
                        </span>
                      ) : <span className="text-slate-300 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-400">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'}
                    </td>
                  </tr>
                );
              })}
              {allUsers.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-16 text-center text-slate-400">Noch keine Nutzer registriert.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
