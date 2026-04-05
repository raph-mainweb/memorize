import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Plus, QrCode, ArrowRight, Heart, Lock, Globe, Zap } from 'lucide-react';
import UnlockButton from './UnlockButton';

export default async function DashboardOverview() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const { data: memorials } = await supabase
    .from('memorial_pages')
    .select('id, name, slug, is_live, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-stone-50">
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-6">
          <div>
            <h1 className="text-3xl font-serif text-slate-900 mb-2">Deine Gedenkseiten</h1>
            <p className="text-slate-500 font-light">Verwalte Seiten, Abonnements und QR-Medaillons.</p>
          </div>
          <Link href="/dashboard/neu" className="bg-slate-900 text-white px-6 py-3.5 rounded-full font-medium hover:bg-slate-800 transition flex items-center gap-2 shadow-sm text-sm whitespace-nowrap">
            <Plus className="w-4 h-4" /> Neue Seite erstellen
          </Link>
        </div>

        {memorials && memorials.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {memorials.map(memorial => (
              <div key={memorial.id} className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 flex flex-col group hover:shadow-md transition duration-300 relative overflow-hidden">

                {/* Status badges */}
                <div className="flex justify-between items-start mb-6">
                  {memorial.is_live ? (
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-sage-100 text-sage-800">
                      <Globe className="w-3 h-3" /> Öffentlich
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
                      <Lock className="w-3 h-3" /> Privat
                    </div>
                  )}
                  <div className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-slate-50 text-slate-500 border border-slate-100 flex items-center gap-1.5">
                    <QrCode className="w-3 h-3" /> Kein Medaillon
                  </div>
                </div>

                <h3 className="font-serif text-2xl text-slate-900 mb-1 truncate">{memorial.name}</h3>
                
                {/* URL — only clickable if live */}
                {memorial.is_live ? (
                  <Link
                    href={`/gedenken/${memorial.slug}`}
                    target="_blank"
                    className="text-sm font-light text-slate-400 hover:text-sage-600 truncate mb-4 transition block"
                  >
                    nachklang.ch/gedenken/{memorial.slug}
                  </Link>
                ) : (
                  <div className="flex items-center gap-1.5 mb-4">
                    <Lock className="w-3 h-3 text-amber-500 flex-shrink-0" />
                    <span className="text-sm font-light text-slate-300 truncate line-through">
                      nachklang.ch/gedenken/{memorial.slug}
                    </span>
                    <span className="text-[10px] text-amber-600 font-medium">nicht öffentlich</span>
                  </div>
                )}

                {/* Unlock CTA for drafts */}
                {!memorial.is_live && (
                  <div className="mb-4 bg-gradient-to-br from-amber-50 to-stone-50 border border-amber-100 rounded-2xl p-4">
                    <p className="text-xs text-slate-600 font-medium mb-3 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      Seite freischalten für CHF 49.–
                    </p>
                    <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                      Erhalte eine öffentliche URL, die du teilen kannst — ohne Anmeldung einsehbar.
                    </p>
                    <UnlockButton memorialId={memorial.id} />
                  </div>
                )}

                {/* Actions */}
                <div className="mt-auto border-t border-stone-100 pt-4 flex gap-3">
                  <Link href={`/dashboard/edit/${memorial.id}`} className="flex-1 text-center py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-slate-600 text-sm font-medium hover:bg-white transition shadow-sm">
                    {memorial.is_live ? 'Verwalten' : 'Bearbeiten'}
                  </Link>
                  <Link
                    href={`/dashboard/medaillon/${memorial.id}`}
                    className="flex-1 text-center py-2.5 rounded-xl bg-sage-50 text-sage-800 text-sm font-medium hover:bg-sage-100 border border-sage-100 transition flex justify-center items-center gap-1 shadow-sm"
                  >
                    Medaillon <ArrowRight className="w-3.5 h-3.5 opacity-70" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass rounded-3xl p-16 flex flex-col items-center justify-center text-center animate-fade-in border border-dashed border-slate-200">
            <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mb-6 shadow-sm">
              <Heart className="w-8 h-8 text-slate-400 fill-slate-400/20" />
            </div>
            <h3 className="text-2xl font-serif text-slate-900 mb-3">Noch keine Gedenkseite vorhanden</h3>
            <p className="text-slate-500 max-w-md mx-auto mb-8 font-light leading-relaxed">
              Erstelle komplett kostenlos eine erste private Vorschau-Seite für deine Liebsten im edlen Design.
            </p>
            <Link href="/dashboard/neu" className="bg-sage-600 text-white px-8 py-4 rounded-full font-medium hover:bg-sage-700 transition shadow-md flex items-center gap-2">
              Erste Erinnerung schaffen <ArrowRight className="w-4 h-4 opacity-70" />
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
