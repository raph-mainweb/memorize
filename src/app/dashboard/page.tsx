import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Plus, Settings, QrCode, ArrowRight, Heart } from 'lucide-react';

export default async function DashboardOverview() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Fetch created memorials for this user
  const { data: memorials } = await supabase
    .from('memorial_pages')
    .select('id, name, slug, is_live, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-stone-50">
      <nav className="bg-white border-b border-stone-100 px-6 h-16 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <Link href="/" className="font-serif text-xl font-bold tracking-tight text-slate-900">
          Nachklang <span className="text-sage-500 font-normal italic">CH</span>
        </Link>
        <div className="flex gap-4 items-center">
           <span className="text-xs font-medium text-slate-500 truncate max-w-[120px] sm:max-w-none bg-stone-100 px-3 py-1.5 rounded-full">{user.email}</span>
           <button className="text-slate-400 hover:text-slate-900 transition"><Settings className="w-5 h-5"/></button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-6">
          <div>
            <h1 className="text-3xl font-serif text-slate-900 mb-2">Deine Gedenkseiten</h1>
            <p className="text-slate-500 font-light">Verwalte Seiten, Abonnements und QR-Medaillons.</p>
          </div>
          <Link href="/dashboard/neu" className="bg-slate-900 text-white px-6 py-3.5 rounded-full font-medium hover:bg-slate-800 transition flex items-center gap-2 shadow-sm text-sm whitespace-nowrap">
            <Plus className="w-4 h-4"/>
            Neue Seite erstellen
          </Link>
        </div>

        {memorials && memorials.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {memorials.map(memorial => (
              <div key={memorial.id} className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 flex flex-col group hover:shadow-md transition duration-300 relative overflow-hidden">
                
                <div className="flex justify-between items-start mb-8 relative z-10">
                  <div className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full ${memorial.is_live ? 'bg-sage-100 text-sage-800' : 'bg-stone-100 text-stone-600'}`}>
                    {memorial.is_live ? 'Aktiviert' : 'Vorschau'}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-slate-50 text-slate-500 border border-slate-100 flex items-center gap-1.5">
                    <QrCode className="w-3 h-3" /> Kein Medaillon
                  </div>
                </div>

                <h3 className="font-serif text-2xl text-slate-900 mb-1 relative z-10 truncate">{memorial.name}</h3>
                <Link href={`/gedenken/${memorial.slug}`} className="text-sm font-light text-slate-400 hover:text-sage-600 truncate mb-10 transition relative z-10 block">
                  nachklang.ch/gedenken/{memorial.slug}
                </Link>

                <div className="mt-auto border-t border-stone-100 pt-4 flex gap-3 relative z-10">
                  <Link href={`/dashboard/edit/${memorial.id}`} className="flex-1 text-center py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-slate-600 text-sm font-medium hover:bg-white transition shadow-sm">
                    Verwalten
                  </Link>
                  <Link href={`/dashboard/medaillon/${memorial.id}`} className="flex-1 text-center py-2.5 rounded-xl bg-sage-50 text-sage-800 text-sm font-medium hover:bg-sage-100 border border-sage-100 transition flex justify-center items-center gap-1 shadow-sm">
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
  )
}
