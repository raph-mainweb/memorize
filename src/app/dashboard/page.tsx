import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Plus, QrCode, ArrowRight, Heart, Globe,
  Zap, Eye, ShoppingBag, ExternalLink
} from 'lucide-react';

import UnlockButton from './UnlockButton';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://memorize-liart.vercel.app';
const DISPLAY_HOST = SITE_URL.replace(/^https?:\/\//, '');
const WP_URL = process.env.WP_URL || 'https://memorize.mainwebsite.ch';

export default async function DashboardOverview() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const email = user.email || '';
  const firstName = email.split('@')[0].split('.')[0];
  const greeting = getGreeting();

  // ── Memorial pages ───────────────────────────────────────────────────────
  const { data: memorials } = await supabase
    .from('memorial_pages')
    .select('id, name, slug, is_live, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const liveCount   = (memorials || []).filter(m => m.is_live).length;
  const draftCount  = (memorials || []).filter(m => !m.is_live).length;

  // ── Medallions ───────────────────────────────────────────────────────────
  const memorialIds = (memorials || []).map(m => m.id);
  const medallionMap: Record<string, string> = {};
  let qrCredits = 0;

  const adminDb = createAdminClient();

  if (memorialIds.length > 0) {
    const { data: byPageId } = await adminDb
      .from('medallion_codes')
      .select('id, code, assigned_page_id, memorial_id')
      .in('inventory_status', ['assigned', 'shipped', 'delivered', 'claimed_by_customer', 'assigned_to_memorial'])
      .in('assigned_page_id', memorialIds);
    (byPageId || []).forEach(c => { if (c.assigned_page_id) medallionMap[c.assigned_page_id] = c.code; });

    const remaining = memorialIds.filter(id => !Object.keys(medallionMap).includes(id));
    if (remaining.length > 0) {
      const { data: byMemId } = await adminDb
        .from('medallion_codes')
        .select('id, code, memorial_id, assigned_page_id')
        .in('status', ['assigned', 'shipped', 'delivered'])
        .in('memorial_id', remaining);
      (byMemId || []).forEach(c => {
        const key = c.assigned_page_id || c.memorial_id;
        if (key && !medallionMap[key]) medallionMap[key] = c.code;
      });
    }
  }

  const connectedCount = Object.keys(medallionMap).length;

  // QR credits
  const { data: profile } = await supabase
    .from('profiles')
    .select('qr_credits')
    .eq('id', user.id)
    .single();
  qrCredits = profile?.qr_credits || 0;

  const recentMemorials = (memorials || []).slice(0, 3);

  return (
    <div className="p-6 md:p-10 max-w-5xl">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <p className="text-slate-400 text-sm font-medium">{greeting}</p>
          <h1 className="text-3xl font-serif text-slate-900 mt-0.5">
            Hallo, {firstName.charAt(0).toUpperCase() + firstName.slice(1)} 👋
          </h1>
        </div>
        <Link
          href="/dashboard/neu"
          className="flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-2xl text-sm font-semibold hover:bg-slate-800 transition shadow-sm"
        >
          <Plus className="w-4 h-4" /> Neue Gedenkseite
        </Link>
      </div>

      {/* ── Stats ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        <StatCard
          label="Gedenkseiten"
          value={String((memorials || []).length)}
          sub={liveCount > 0 ? `${liveCount} live · ${draftCount} Entwurf` : 'Noch keine live'}
        />
        <StatCard
          label="Medaillons"
          value={String(connectedCount)}
          sub={connectedCount > 0 ? `${connectedCount} verbunden` : 'Noch keins verbunden'}
        />
        <StatCard
          label="QR-Guthaben"
          value={String(qrCredits)}
          sub={qrCredits > 0 ? 'Verfügbar' : undefined}
          action={qrCredits === 0 ? { label: 'Bestellen →', href: '/medaillons' } : undefined}
        />
      </div>

      {/* ── Gedenkseiten ────────────────────────────────────────────────────── */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Gedenkseiten</h2>
          {(memorials || []).length > 3 && (
            <Link href="/dashboard/gedenkseiten" className="text-sm text-slate-500 hover:text-slate-800 flex items-center gap-1 transition">
              Alle anzeigen <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {recentMemorials.length > 0 ? (
          <div className="space-y-3">
            {recentMemorials.map(memorial => {
              const assignedCode = medallionMap[memorial.id];
              return (
                <div key={memorial.id} className="bg-white rounded-2xl border border-stone-100 px-5 py-4 flex items-center gap-4 hover:shadow-sm transition">
                  {/* Avatar placeholder */}
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
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
                        Entwurf
                      </span>
                    )}
                    {assignedCode && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-50 text-slate-600 border border-slate-100 flex items-center gap-1">
                        <QrCode className="w-2.5 h-2.5" /> {assignedCode}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link href={memorial.is_live ? `/gedenken/${memorial.slug}` : `/dashboard/preview/${memorial.id}`}
                      target="_blank"
                      className="p-2 rounded-xl border border-stone-200 text-slate-400 hover:text-slate-700 hover:bg-stone-50 transition"
                      title="Vorschau">
                      <Eye className="w-3.5 h-3.5" />
                    </Link>
                    <Link href={`/dashboard/edit/${memorial.id}`}
                      className="px-3 py-2 rounded-xl border border-stone-200 text-sm text-slate-600 font-medium hover:bg-stone-50 transition">
                      {memorial.is_live ? 'Verwalten' : 'Bearbeiten'}
                    </Link>
                    {!memorial.is_live && (
                      <UnlockButton memorialId={memorial.id} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={<Heart className="w-7 h-7 text-stone-400" />}
            title="Noch keine Gedenkseite"
            desc="Erstelle kostenlos eine erste Gedenkseite im edlen Design."
            action={{ label: 'Gedenkseite erstellen', href: '/dashboard/neu' }}
          />
        )}
      </section>

      {/* ── Quick actions ────────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Schnellzugriff</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <QuickCard
            icon={<ShoppingBag className="w-5 h-5 text-violet-500" />}
            title="Medaillon bestellen"
            desc="QR-Medaillon für die Gedenkstätte"
            href="/medaillons"
            bg="bg-violet-50"
          />
          <QuickCard
            icon={<Zap className="w-5 h-5 text-amber-500" />}
            title="Seite freischalten"
            desc="Gedenkseite öffentlich machen"
            href="/dashboard/neu"
            bg="bg-amber-50"
          />
          <QuickCard
            icon={<ExternalLink className="w-5 h-5 text-emerald-600" />}
            title="Zu nachklang.ch"
            desc="Zur öffentlichen Website"
            href={WP_URL}
            external
            bg="bg-emerald-50"
          />
        </div>
      </section>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, action }: {
  label: string; value: string; sub?: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="bg-white rounded-2xl border border-stone-100 p-4 md:p-5">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">{label}</p>
      <p className="text-3xl font-semibold text-slate-900 mb-1">{value}</p>
      {sub && <p className="text-xs text-slate-400">{sub}</p>}
      {action && (
        <Link href={action.href} className="text-xs font-medium text-violet-600 hover:text-violet-700 transition mt-1 block">
          {action.label}
        </Link>
      )}
    </div>
  );
}

function QuickCard({ icon, title, desc, href, bg, external }: {
  icon: React.ReactNode; title: string; desc: string;
  href: string; bg: string; external?: boolean;
}) {
  return (
    <Link
      href={href}
      target={external ? '_blank' : undefined}
      className="bg-white rounded-2xl border border-stone-100 p-5 hover:shadow-sm transition group flex gap-4 items-start"
    >
      <div className={`${bg} w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="font-semibold text-slate-900 text-sm group-hover:text-slate-700 transition">{title}</p>
        <p className="text-xs text-slate-400 mt-0.5 leading-snug">{desc}</p>
      </div>
    </Link>
  );
}

function EmptyState({ icon, title, desc, action }: {
  icon: React.ReactNode; title: string; desc: string;
  action: { label: string; href: string };
}) {
  return (
    <div className="bg-white rounded-2xl border border-dashed border-stone-200 p-10 flex flex-col items-center text-center">
      <div className="w-14 h-14 bg-stone-100 rounded-full flex items-center justify-center mb-4">{icon}</div>
      <p className="font-semibold text-slate-900 mb-1">{title}</p>
      <p className="text-sm text-slate-400 mb-5 max-w-xs">{desc}</p>
      <Link href={action.href}
        className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-800 transition">
        {action.label} <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Guten Morgen';
  if (h < 18) return 'Guten Tag';
  return 'Guten Abend';
}
