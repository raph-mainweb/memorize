import { createAdminClient } from '@/utils/supabase/admin';
import { Package, User, MapPin, Hash, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

export const metadata = { title: 'Bestellungen | Nachklang Admin' };

export default async function OrdersPage() {
  const db = createAdminClient();

  // Load all orders — any status — newest first
  const { data: orders, error } = await db
    .from('medallion_orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) console.error('[Admin/Orders] DB error:', error.message);

  // Load user emails from auth (profiles has no email col)
  const { data: { users: authUsers } } = await db.auth.admin.listUsers({ perPage: 1000 });
  const emailMap: Record<string, string> = {};
  (authUsers || []).forEach(u => { emailMap[u.id] = u.email || u.id; });

  // Load memorial names
  const memorialIds = Array.from(new Set((orders || []).map(o => o.memorial_id).filter(Boolean))) as string[];
  const memorialMap: Record<string, string> = {};
  if (memorialIds.length > 0) {
    const { data: memorials } = await db
      .from('memorial_pages')
      .select('id, name, slug')
      .in('id', memorialIds);
    (memorials || []).forEach(m => { memorialMap[m.id] = m.name || m.slug || m.id; });
  }

  // Load assigned codes
  const codeIds = Array.from(new Set((orders || []).map(o => o.medallion_code_id).filter(Boolean))) as string[];
  const codeMap: Record<string, string> = {};
  if (codeIds.length > 0) {
    const { data: codes } = await db.from('medallion_codes').select('id, code').in('id', codeIds);
    (codes || []).forEach(c => { codeMap[c.id] = c.code; });
  }

  // Load product names
  const productIds = Array.from(new Set((orders || []).map(o => o.product_id).filter(Boolean))) as string[];
  const productMap: Record<string, string> = {};
  if (productIds.length > 0) {
    const { data: products } = await db.from('products').select('id, title').in('id', productIds);
    (products || []).forEach(p => { productMap[p.id] = p.title; });
  }

  const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
    pending: { label: 'Ausstehend', color: 'bg-amber-50 text-amber-700', icon: Clock },
    pending_stock: { label: 'Wartet auf Lager', color: 'bg-orange-50 text-orange-700', icon: AlertTriangle },
    processing: { label: 'In Bearbeitung', color: 'bg-blue-50 text-blue-700', icon: Package },
    shipped: { label: 'Versendet', color: 'bg-emerald-50 text-emerald-700', icon: CheckCircle2 },
    delivered: { label: 'Zugestellt', color: 'bg-slate-50 text-slate-600', icon: CheckCircle2 },
  };

  return (
    <div className="p-8 md:p-12 max-w-5xl">
      <div className="mb-10">
        <h1 className="text-3xl font-serif text-slate-900 mb-1">Bestellungen</h1>
        <p className="text-slate-500 text-sm">{(orders || []).length} Bestellungen gesamt</p>
      </div>

      {(!orders || orders.length === 0) ? (
        <div className="bg-white border border-dashed border-slate-200 rounded-3xl p-16 text-center">
          <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Noch keine Bestellungen.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {(orders || []).map(order => {
            const status = statusConfig[order.status] || { label: order.status || '?', color: 'bg-stone-100 text-stone-600', icon: Hash };
            const Icon = status.icon;
            const email = emailMap[order.user_id] || order.user_id;
            const memorial = memorialMap[order.memorial_id] || '—';
            const code = order.medallion_code_id ? (codeMap[order.medallion_code_id] || '—') : '⚠ Kein Code';
            const product = order.product_id ? (productMap[order.product_id] || '—') : '—';
            const shippingStr = order.shipping_address
              ? (() => { try { const p = JSON.parse(order.shipping_address); return `${p.first_name || ''} ${p.last_name || ''}\n${p.address_line1 || ''}\n${p.postal_code || ''} ${p.city || ''}\n${p.country || ''}`.trim(); } catch { return order.shipping_address; } })()
              : '—';

            return (
              <div key={order.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-slate-400">#{order.id.split('-')[0].toUpperCase()}</span>
                    <span className="text-slate-700 font-medium text-sm">{product}</span>
                  </div>
                  <div className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${status.color}`}>
                    <Icon className="w-3 h-3" /> {status.label}
                  </div>
                </div>
                {/* Body */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 px-6 py-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1"><User className="w-3 h-3" /> Kunde</p>
                    <p className="text-sm text-slate-700 break-all">{email}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1"><Hash className="w-3 h-3" /> QR-Code</p>
                    <p className={`text-sm font-mono font-semibold ${order.medallion_code_id ? 'text-slate-900' : 'text-orange-600'}`}>{code}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">Gedenkseite</p>
                    <p className="text-sm text-slate-700">{memorial}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> Lieferadresse</p>
                    <p className="text-xs text-slate-600 whitespace-pre-line">{shippingStr}</p>
                  </div>
                </div>
                {order.stripe_session_id && (
                  <div className="px-6 py-2 bg-stone-50 border-t border-slate-100">
                    <p className="text-[10px] text-slate-400 font-mono">{order.stripe_session_id}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
