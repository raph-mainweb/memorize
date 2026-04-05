import { createAdminClient } from '@/utils/supabase/admin';
import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import { Heart, MessageSquare } from 'lucide-react';

export default async function MemorialPage({ params }: { params: { slug: string } }) {
  const supabase = createAdminClient();
  
  const { data: memorial } = await supabase
    .from('memorial_pages')
    .select('*')
    .eq('slug', params.slug)
    .single();

  if (!memorial) {
    notFound();
  }

  // If page is NOT live, only allow the owner to see it
  if (!memorial.is_live) {
    const userClient = createClient();
    const { data: { user } } = await userClient.auth.getUser();
    
    // Not logged in or not the owner → 404
    if (!user || user.id !== memorial.user_id) {
      notFound();
    }
  }

  const isPreview = !memorial.is_live;

  return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col relative selection:bg-sage-200">
      
      {/* Private preview banner (only visible to owner) */}
      {isPreview && (
        <div className="bg-slate-900 text-white text-xs sm:text-sm font-medium py-3 px-4 text-center sticky top-0 z-50 flex justify-center items-center gap-4">
          <span className="opacity-90 font-light tracking-wide">
            🔒 Private Vorschau — nur für dich sichtbar. Aktiviere die Seite, um sie öffentlich zugänglich zu machen.
          </span>
          <a
            href={`/dashboard/edit/${memorial.id}`}
            className="bg-white text-slate-900 px-4 py-1.5 rounded-full text-xs font-semibold hover:bg-sage-100 transition shadow-sm whitespace-nowrap"
          >
            Freischalten →
          </a>
        </div>
      )}

      {/* Hero Image Area */}
      <div className="relative w-full h-[45vh] md:h-[60vh] bg-stone-300 overflow-hidden">
        {memorial.title_image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={memorial.title_image} alt="" className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/80" />
        <div className="absolute bottom-0 w-full p-8 md:p-16 text-center animate-slide-up">
          <h1 className="text-4xl md:text-6xl font-serif text-white tracking-wide drop-shadow-md mb-2">
            {memorial.name}
          </h1>
          {(memorial.birth_date || memorial.death_date) && (
            <p className="text-white/70 font-light tracking-widest text-xs md:text-sm mt-3">
              {memorial.birth_date && new Date(memorial.birth_date).getFullYear()}
              {memorial.birth_date && memorial.death_date && ' – '}
              {memorial.death_date && new Date(memorial.death_date).getFullYear()}
            </p>
          )}
          <p className="text-white/80 font-light tracking-widest uppercase text-xs md:text-sm mt-2">
            In liebevoller Erinnerung
          </p>
        </div>
      </div>

      <main className="flex-grow max-w-3xl mx-auto w-full px-6 py-12 md:py-24 animate-fade-in" style={{ animationDelay: '0.3s', animationFillMode: 'both' }}>
        
        {/* Biography */}
        <div className="text-center mb-20">
          <Heart className="w-5 h-5 mx-auto text-sage-400 mb-6 opacity-60 fill-sage-400/20" />
          {memorial.biography ? (
            <div className="text-left text-slate-600 leading-loose space-y-6 font-light whitespace-pre-line">
              {memorial.biography}
            </div>
          ) : (
            <p className="font-serif text-xl md:text-2xl leading-relaxed text-slate-500 max-w-xl mx-auto italic">
              &quot;Wenn die Sonne des Lebens untergeht, leuchten die Sterne der Erinnerung.&quot;
            </p>
          )}
        </div>

        {/* Guestbook */}
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-stone-100 mt-16 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-stone-100 via-sage-200 to-stone-100" />
          <div className="flex items-center gap-3 mb-8">
            <MessageSquare className="w-5 h-5 text-sage-500" />
            <h3 className="text-2xl font-serif text-slate-900">Kondolenzen</h3>
          </div>
          <div className="text-center py-12 bg-stone-50 rounded-2xl border border-dashed border-stone-200">
            <p className="text-slate-500 font-light text-sm">Noch keine Einträge vorhanden.</p>
            {memorial.is_live && (
              <button className="mt-6 border border-sage-200 bg-white text-sage-800 px-6 py-2.5 rounded-full text-sm font-medium shadow-sm hover:bg-sage-50 transition">
                Erinnerung teilen
              </button>
            )}
          </div>
        </div>
      </main>

      <footer className="w-full py-10 text-center bg-stone-100 text-slate-400 text-[10px] uppercase tracking-widest font-medium">
        Digitale Gedenkseite gepflegt von NACHKLANG CH
      </footer>
    </div>
  );
}
