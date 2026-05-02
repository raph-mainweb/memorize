/**
 * /dashboard/gedenkseiten — Alle Gedenkseiten des Kunden
 */
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Plus, Heart, Globe, Lock, QrCode, Eye, ArrowRight, Zap } from 'lucide-react';
import UnlockButton from '../UnlockButton';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://memorize-liart.vercel.app';
const DISPLAY_HOST = SITE_URL.replace(/^https?:\/\//, '');

export const metadata = { title: 'Meine Gedenkseiten | Nachklang' };

export default async function GedenkSeitenPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: memorials } = await supabase
    .from('memorial_pages')
    .select('id, name, slug, is_live, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // Medallion map
  const memorialIds = (memorials || []).map(m => m.id);
  const medallionMap: Record<string, string> = {};

  if (memorialIds.length > 0) {
    const adminDb = createAdminClient();
    const { data: byPageId } = await adminDb
      .from('medallion_codes')
      .select('code, assigned_page_id, memorial_id')
      .in('inventory_status', ['assigned', 'shipped', 'delivered', 'claimed_by_customer', 'assigned_to_memorial'])
      .in('assigned_page_id', memorialIds);
    (byPageId || []).forEach(c => { if (c.assigned_page_id) medallionMap[c.assigned_page_id] = c.code; });

    const remaining = memorialIds.filter(id => !Object.keys(medallionMap).includes(id));
    if (remaining.length > 0) {
      const { data: byMemId } = await adminDb
        .from('medallion_codes')
        .select('code, memorial_id, assigned_page_id')
        .in('status', ['assigned', 'shipped', 'delivered'])
        .in('memorial_id', remaining);
      (byMemId || []).forEach(c => {
        const key = c.assigned_page_id || c.memorial_id;
        if (key && !medallionMap[key]) medallionMap[key] = c.code;
      });
    }
  }

  return (
    <div className="p-6 md:p-10 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-serif text-slate-900">Meine Gedenkseiten</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {(memorials || []).length} Seite{(memorials || []).length !== 1 ? 'n' : ''} gesamt
          </p>
        </div>
        <Link
          href="/dashboard/neu"
          className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-800 transition"
        >
          <Plus className="w-4 h-4" /> Neue Seite
        </Link>
      </div>

      {/* List */}
      {(memorials || []).length > 0 ? (
        <div className="space-y-3">
          {(memorials || []).map(memorial => {
            const assignedCode = medallionMap[memorial.id];
            return (
              <div key={memorial.id} className="bg-white rounded-2xl border border-stone-100 px-5 py-4 flex items-center gap-4 hover:shadow-sm transition">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center flex-shrink-0">
                  <Heart className="w-4 h-4 text-stone-400" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{memorial.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">
                    {memorial.is_live
                      ? `${DISPLAY_HOST}/gedenken/${memorial.slug}`
                      : 'Noch nicht öffentlich'}
                  </p>
                </div>

                {/* Badges */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {memorial.is_live ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1">
                      <Globe className="w-2.5 h-2.5" /> Live
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100 flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" /> Entwurf
                    </span>
                  )}
                  {assignedCode ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-50 text-slate-600 border border-slate-100 flex items-center gap-1">
                      <QrCode className="w-2.5 h-2.5" /> {assignedCode}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-stone-50 text-stone-400 border border-stone-100 flex items-center gap-1">
                      <QrCode className="w-2.5 h-2.5" /> Kein QR
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    href={memorial.is_live ? `/gedenken/${memorial.slug}` : `/dashboard/preview/${memorial.id}`}
                    target="_blank"
                    className="p-2 rounded-xl border border-stone-200 text-slate-400 hover:text-slate-700 hover:bg-stone-50 transition"
                    title="Vorschau"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </Link>
                  <Link
                    href={`/dashboard/edit/${memorial.id}`}
                    className="px-3 py-2 rounded-xl border border-stone-200 text-sm text-slate-600 font-medium hover:bg-stone-50 transition"
                  >
                    {memorial.is_live ? 'Verwalten' : 'Bearbeiten'}
                  </Link>
                  {!memorial.is_live && <UnlockButton memorialId={memorial.id} />}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-dashed border-stone-200 p-16 flex flex-col items-center text-center">
          <div className="w-14 h-14 bg-stone-100 rounded-full flex items-center justify-center mb-4">
            <Heart className="w-7 h-7 text-stone-400" />
          </div>
          <p className="font-semibold text-slate-900 mb-1">Noch keine Gedenkseite</p>
          <p className="text-sm text-slate-400 mb-5 max-w-xs">
            Erstelle kostenlos eine erste Gedenkseite im edlen Design.
          </p>
          <Link
            href="/dashboard/neu"
            className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-800 transition"
          >
            Gedenkseite erstellen <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}
