/**
 * /dashboard/medaillon — Index: Alle Medaillons des Kunden
 * Listet alle Medaillons die mit den Gedenkseiten des Users verbunden sind.
 */
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { QrCode, ArrowRight, ShoppingBag, CheckCircle2, Package, Truck } from 'lucide-react';

const WP_SHOP = `${process.env.WP_URL || 'https://memorize.mainwebsite.ch'}/shop`;

export const metadata = { title: 'Meine Medaillons | Nachklang' };

export default async function MedaillonIndexPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  type Memorial = { id: string; name: string; slug: string; is_live: boolean };

  const { data: memorials } = await supabase
    .from('memorial_pages')
    .select('id, name, slug, is_live')
    .eq('user_id', user.id);

  const memorialIds = (memorials || []).map(m => m.id);
  const memorialLookup: Record<string, Memorial> = {};
  (memorials || []).forEach((m: Memorial) => { memorialLookup[m.id] = m; });

  type Medallion = {
    id: string;
    code: string;
    status: string;
    inventory_status: string | null;
    assigned_page_id: string | null;
    memorial_id: string | null;
    assigned_at: string | null;
  };

  let medallions: Medallion[] = [];

  if (memorialIds.length > 0) {
    const adminDb = createAdminClient();
    const { data: byPageId } = await adminDb
      .from('medallion_codes')
      .select('id, code, status, inventory_status, assigned_page_id, memorial_id, assigned_at')
      .in('inventory_status', ['assigned', 'shipped', 'delivered', 'claimed_by_customer', 'assigned_to_memorial'])
      .in('assigned_page_id', memorialIds);
    medallions = [...(byPageId || [])];

    const assignedPageIds = medallions.map(m => m.assigned_page_id).filter(Boolean);
    const remaining = memorialIds.filter(id => !assignedPageIds.includes(id));
    if (remaining.length > 0) {
      const { data: byMemId } = await adminDb
        .from('medallion_codes')
        .select('id, code, status, inventory_status, assigned_page_id, memorial_id, assigned_at')
        .in('status', ['assigned', 'shipped', 'delivered'])
        .in('memorial_id', remaining);
      medallions = [...medallions, ...(byMemId || [])];
    }
  }

  const statusConfig: Record<string, { label: string; color: string; icon: typeof Package }> = {
    assigned:             { label: 'Zugewiesen',  color: 'bg-blue-50 text-blue-700 border-blue-100',    icon: Package },
    claimed_by_customer:  { label: 'Aktiviert',   color: 'bg-violet-50 text-violet-700 border-violet-100', icon: CheckCircle2 },
    assigned_to_memorial: { label: 'Verbunden',   color: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: CheckCircle2 },
    shipped:              { label: 'Versendet',   color: 'bg-amber-50 text-amber-700 border-amber-100',  icon: Truck },
    delivered:            { label: 'Zugestellt',  color: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: CheckCircle2 },
  };

  return (
    <div className="p-6 md:p-10 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-serif text-slate-900">Meine Medaillons</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {medallions.length} Medaillon{medallions.length !== 1 ? 's' : ''} verbunden
          </p>
        </div>
        <Link
          href={WP_SHOP}
          target="_blank"
          className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-800 transition"
        >
          <ShoppingBag className="w-4 h-4" /> Medaillon kaufen
        </Link>
      </div>

      {medallions.length > 0 ? (
        <div className="space-y-3">
          {medallions.map(med => {
            const memId = med.assigned_page_id || med.memorial_id || '';
            const memorial = memorialLookup[memId];
            const statusKey = med.inventory_status || med.status;
            const st = statusConfig[statusKey] || statusConfig.assigned;
            const Icon = st.icon;

            return (
              <div key={med.id} className="bg-white rounded-2xl border border-stone-100 px-5 py-4 flex items-center gap-4 hover:shadow-sm transition">
                {/* QR Icon */}
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <QrCode className="w-4 h-4 text-slate-500" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-mono font-bold text-slate-900 text-sm">{med.code}</p>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">
                    {memorial ? `Verbunden mit: ${memorial.name}` : 'Gedenkseite nicht gefunden'}
                  </p>
                </div>

                {/* Status badge */}
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border flex items-center gap-1 flex-shrink-0 ${st.color}`}>
                  <Icon className="w-2.5 h-2.5" /> {st.label}
                </span>

                {/* Action */}
                {memorial && (
                  <Link
                    href={`/dashboard/medaillon/${memorial.id}`}
                    className="flex items-center gap-1 px-3 py-2 rounded-xl border border-stone-200 text-sm text-slate-600 font-medium hover:bg-stone-50 transition flex-shrink-0"
                  >
                    Details <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-dashed border-stone-200 p-16 flex flex-col items-center text-center">
          <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <QrCode className="w-7 h-7 text-slate-400" />
          </div>
          <p className="font-semibold text-slate-900 mb-1">Noch kein Medaillon</p>
          <p className="text-sm text-slate-400 mb-5 max-w-xs">
            Bestelle jetzt ein hochwertiges QR-Medaillon und verknüpfe es mit deiner Gedenkseite.
          </p>
          <Link
            href={WP_SHOP}
            target="_blank"
            className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-800 transition"
          >
            <ShoppingBag className="w-4 h-4" /> Jetzt bestellen <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}
