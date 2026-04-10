import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { QrCode, ArrowLeft, CheckCircle2, Package, Truck, MapPin, ExternalLink } from 'lucide-react';
import Image from 'next/image';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://memorize-liart.vercel.app';

export const metadata = { title: 'Mein Medaillon | Nachklang' };

export default async function MedaillonDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const adminDb = createAdminClient();

  // Verify the memorial belongs to this user
  const { data: memorial } = await adminDb
    .from('memorial_pages')
    .select('id, name, slug, is_live')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single();

  if (!memorial) notFound();

  // Find the medallion assigned to this memorial
  // Check both assigned_page_id AND memorial_id (legacy), primary field is inventory_status
  const { data: medallion } = await adminDb
    .from('medallion_codes')
    .select('id, code, status, inventory_status, qr_url, assigned_at, connected_at, product_id')
    .or(`assigned_page_id.eq.${params.id},memorial_id.eq.${params.id}`)
    .in('inventory_status', ['assigned', 'shipped', 'delivered', 'claimed_by_customer', 'assigned_to_memorial'])
    .maybeSingle();

  const statusLabel: Record<string, { label: string; color: string; icon: typeof Package }> = {
    assigned: { label: 'Zugewiesen', color: 'text-blue-700 bg-blue-50', icon: Package },
    shipped: { label: 'Versendet', color: 'text-amber-700 bg-amber-50', icon: Truck },
    delivered: { label: 'Zugestellt', color: 'text-emerald-700 bg-emerald-50', icon: CheckCircle2 },
  };

  const st = medallion ? (statusLabel[medallion.inventory_status || medallion.status] || statusLabel.assigned) : null;
  const Icon = st?.icon || Package;
  const qrUrl = medallion?.qr_url || (medallion ? `${SITE_URL}/m/${medallion.code}` : null);

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 mb-8 transition">
          <ArrowLeft className="w-4 h-4" /> Zurück zum Dashboard
        </Link>

        <h1 className="text-3xl font-serif text-slate-900 mb-1">{memorial.name}</h1>
        <p className="text-slate-500 text-sm mb-10">QR-Medaillon Übersicht</p>

        {medallion ? (
          <div className="space-y-4">
            {/* Status card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Medaillon-Status</h2>
                {st && (
                  <div className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full ${st.color}`}>
                    <Icon className="w-3.5 h-3.5" /> {st.label}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Code</p>
                  <p className="font-mono font-bold text-slate-900 text-lg">{medallion.code}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Zugewiesen am</p>
                  <p className="text-slate-700">
                    {medallion.assigned_at
                      ? new Date(medallion.assigned_at).toLocaleDateString('de-CH')
                      : '—'}
                  </p>
                </div>
              </div>
            </div>

            {/* QR Code display */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">QR-Code</h2>
              <div className="flex flex-col items-center gap-4">
                {qrUrl && (
                  <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
                    <Image
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUrl)}`}
                      alt={`QR-Code für ${medallion.code}`}
                      width={200}
                      height={200}
                      className="rounded-lg"
                    />
                  </div>
                )}
                <div className="text-center">
                  <p className="text-xs text-slate-400 mb-1">QR-Link</p>
                  <Link href={qrUrl || '#'} target="_blank"
                    className="text-sm text-sage-700 hover:text-sage-900 font-medium flex items-center gap-1">
                    {qrUrl} <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Connected memorial */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3">Verbundene Gedenkseite</h2>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                <div>
                  <p className="font-medium text-slate-900">{memorial.name}</p>
                  {memorial.is_live && (
                    <Link href={`/gedenken/${memorial.slug}`} target="_blank"
                      className="text-xs text-slate-400 hover:text-sage-600 transition flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> /gedenken/{memorial.slug}
                    </Link>
                  )}
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-400 text-center pt-2">
              Das physische Medaillon wird nach Bestelleingang versendet. Bei Fragen:{' '}
              <a href="mailto:hallo@nachklang.ch" className="text-sage-700 hover:underline">hallo@nachklang.ch</a>
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-16 text-center shadow-sm">
            <QrCode className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="font-medium text-slate-700 mb-2">Kein Medaillon zugewiesen</h3>
            <p className="text-sm text-slate-400 mb-6">
              Bestelle jetzt ein QR-Medaillon und verknüpfe es mit dieser Gedenkseite.
            </p>
            <Link href="/medaillons"
              className="inline-flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-full text-sm font-medium hover:bg-slate-800 transition">
              Medaillon kaufen <ArrowLeft className="w-4 h-4 rotate-180" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
