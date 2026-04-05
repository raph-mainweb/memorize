import { createAdminClient } from '@/utils/supabase/admin';
import { createClient } from '@/utils/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { Heart, MessageSquare, Lock, ArrowLeft, Zap } from 'lucide-react';
import Link from 'next/link';

// OWNER-ONLY PREVIEW ROUTE
// Security layers:
//   1. Middleware: /dashboard/* requires authentication (redirects to login)
//   2. This component: server-side ownership check (user.id === memorial.user_id)
//   3. Uses page ID (UUID), not slug — not guessable
//   4. Never reveals draft content to non-owners

export default async function PreviewPage({ params }: { params: { id: string } }) {
  // Layer 1 is already handled by middleware (user must be logged in to reach /dashboard)
  // Layer 2: Verify ownership server-side
  const userClient = createClient();
  const { data: { user } } = await userClient.auth.getUser();

  if (!user) {
    // Middleware should have caught this, but belt-and-suspenders
    redirect(`/auth/login?redirect=/dashboard/preview/${params.id}`);
  }

  // Fetch the page as admin (bypasses RLS) to check existence
  const adminDb = createAdminClient();
  const { data: memorial } = await adminDb
    .from('memorial_pages')
    .select('*')
    .eq('id', params.id)
    .single();

  // Page doesn't exist → 404 (no hint about why)
  if (!memorial) {
    notFound();
  }

  // Owner check: if the logged-in user is NOT the owner → 403
  if (memorial.user_id !== user.id) {
    // Redirect to a generic forbidden page rather than exposing the 403 reason
    redirect('/dashboard?error=forbidden');
  }

  // If already live, no reason to use the preview URL — redirect to public URL
  if (memorial.is_live) {
    redirect(`/gedenken/${memorial.slug}`);
  }

  // ✓ User is authenticated AND is the owner AND page is still a draft
  return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col relative selection:bg-sage-200">

      {/* Private preview sticky banner */}
      <div className="bg-slate-900 text-white py-3 px-4 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Lock className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span className="font-medium">Private Vorschau</span>
            <span className="text-white/60 hidden sm:inline">— nur für dich als Eigentümer sichtbar</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/dashboard/edit/${memorial.id}`}
              className="flex items-center gap-1.5 text-white/70 hover:text-white text-xs transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Bearbeiten
            </Link>
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-white text-xs font-semibold px-4 py-1.5 rounded-full transition whitespace-nowrap"
            >
              <Zap className="w-3 h-3" />
              Freischalten & Veröffentlichen
            </Link>
          </div>
        </div>
      </div>

      {/* Memorial Content (same as public, just with the banner above) */}
      <div className="relative w-full h-[45vh] md:h-[60vh] bg-stone-300 overflow-hidden">
        {memorial.title_image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={memorial.title_image} alt="" className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/80" />
        <div className="absolute bottom-0 w-full p-8 md:p-16 text-center">
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

      <main className="flex-grow max-w-3xl mx-auto w-full px-6 py-12 md:py-24">
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

        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-stone-100 mt-16 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-stone-100 via-sage-200 to-stone-100" />
          <div className="flex items-center gap-3 mb-8">
            <MessageSquare className="w-5 h-5 text-sage-500" />
            <h3 className="text-2xl font-serif text-slate-900">Kondolenzen</h3>
          </div>
          <div className="text-center py-12 bg-stone-50 rounded-2xl border border-dashed border-stone-200">
            <p className="text-slate-500 font-light text-sm">Kondolenzen sind erst nach Freischaltung sichtbar.</p>
          </div>
        </div>
      </main>

      <footer className="w-full py-10 text-center bg-stone-100 text-slate-400 text-[10px] uppercase tracking-widest font-medium">
        Digitale Gedenkseite gepflegt von NACHKLANG CH
      </footer>
    </div>
  );
}
