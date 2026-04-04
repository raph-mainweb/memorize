import Link from 'next/link';
import { ChevronRight, Heart, QrCode, Sparkles } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex-grow flex flex-col items-center">
      
      {/* Navigation */}
      <nav className="w-full max-w-7xl px-6 lg:px-8 h-24 flex items-center justify-between z-50 absolute top-0">
        <div className="font-serif text-2xl font-bold tracking-tight text-slate-900">
          Nachklang <span className="text-sage-500 font-normal italic">CH</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/auth/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition">
            Anmelden
          </Link>
          <Link href="/dashboard/neu" className="text-sm font-medium bg-slate-900 text-white px-5 py-2.5 rounded-full hover:bg-slate-800 transition shadow-sm">
            Kostenlos starten
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative w-full px-6 lg:px-8 pt-48 pb-24 md:pt-56 md:pb-32 flex flex-col items-center text-center overflow-hidden min-h-[85vh] justify-center">
        {/* Background decoration elements */}
        <div className="absolute top-[-5%] left-[-5%] w-[300px] h-[300px] md:w-[500px] md:h-[500px] rounded-full bg-sage-100/40 blur-3xl -z-10" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] md:w-[600px] md:h-[600px] rounded-full bg-stone-200/50 blur-3xl -z-10" />

        <div className="max-w-3xl animate-fade-in relative z-10 flex flex-col items-center">
          <span className="text-sage-600 font-medium tracking-widest uppercase text-xs mb-6">Schweizer Gedenkplattform</span>
          <h1 className="text-5xl md:text-7xl font-serif text-slate-900 mb-8 leading-[1.15] tracking-tight">
            Bewahre Erinnerungen für die Ewigkeit.
          </h1>
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed font-light">
            Erstelle würdevolle Online-Gedenkseiten für deine Liebsten und verknüpfe sie sofort mit unserem eleganten QR-Medaillon für das Grab.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up opacity-0 w-full md:w-auto" style={{ animationFillMode: 'forwards', animationDelay: '0.2s' }}>
            <Link href="/dashboard/neu" className="w-full sm:w-auto bg-slate-900 text-white px-8 py-4 rounded-full font-medium hover:bg-slate-800 transition flex items-center justify-center gap-2 shadow-xl shadow-slate-900/10">
              Gedenkseite erstellen
              <ChevronRight className="w-4 h-4 opacity-70" />
            </Link>
            <Link href="#so-funktioniert" className="w-full sm:w-auto bg-white/60 backdrop-blur-sm border border-slate-200 text-slate-700 px-8 py-4 rounded-full font-medium hover:bg-white transition flex items-center justify-center shadow-sm">
              Mehr erfahren
            </Link>
          </div>
          <p className="text-sm text-slate-400 mt-8 tracking-wide">Kostenloser Einstieg • Ohne Kreditkarte</p>
        </div>
      </section>

      {/* Value Proposition / 3 Steps */}
      <section id="so-funktioniert" className="w-full bg-white relative border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-24 md:py-32">
          
          <div className="text-center max-w-2xl mx-auto mb-16 md:mb-24">
            <h2 className="text-3xl md:text-4xl font-serif text-slate-900 mb-6">Verbinde die analoge und digitale Welt.</h2>
            <p className="text-slate-600 font-light text-lg">Ein respektvoller Prozess, transparent und ohne Wartezeiten.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 md:gap-8">
            
            {/* Feature 1 */}
            <div className="flex flex-col items-center text-center group">
              <div className="w-16 h-16 bg-stone-50 rounded-2xl flex items-center justify-center mb-6 border border-stone-100 shadow-sm group-hover:-translate-y-1 transition duration-300">
                <Sparkles className="w-6 h-6 text-sage-600" />
              </div>
              <h3 className="text-xl font-serif text-slate-900 mb-3">1. Seite gestalten</h3>
              <p className="text-slate-500 leading-relaxed font-light">
                Erstelle kostenlos eine wunderschöne Online-Vorschau. Lade wertvolle Fotos hoch und schreibe eine Biografie.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="flex flex-col items-center text-center group">
              <div className="w-16 h-16 bg-stone-50 rounded-2xl flex items-center justify-center mb-6 border border-stone-100 shadow-sm group-hover:-translate-y-1 transition duration-300">
                <Heart className="w-6 h-6 text-sage-600" />
              </div>
              <h3 className="text-xl font-serif text-slate-900 mb-3">2. Freischalten</h3>
              <p className="text-slate-500 leading-relaxed font-light">
                Aktiviere die Seite für 19 CHF mit einer eleganten, permanenten URL (nachklang.ch/gedenken/name).
              </p>
            </div>

            {/* Feature 3 */}
            <div className="flex flex-col items-center text-center group">
              <div className="w-16 h-16 bg-stone-50 rounded-2xl flex items-center justify-center mb-6 border border-stone-100 shadow-sm group-hover:-translate-y-1 transition duration-300">
                <QrCode className="w-6 h-6 text-sage-600" />
              </div>
              <h3 className="text-xl font-serif text-slate-900 mb-3">3. Medaillon bestellen</h3>
              <p className="text-slate-500 leading-relaxed font-light">
                Bestelle das wetterfeste QR-Medaillon. Dank unserem eigenen Schweizer Lager wird es innert 1-2 Tagen direkt zu dir geschickt.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Basic Footer */}
      <footer className="w-full border-t border-slate-100 bg-stone-50 py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between text-slate-500 text-sm">
          <div>© {new Date().getFullYear()} Nachklang CH. Ein würdevolles Andenken.</div>
          <div className="flex gap-6 mt-6 md:mt-0">
            <Link href="/" className="hover:text-slate-900 transition">Impressum</Link>
            <Link href="/" className="hover:text-slate-900 transition">Datenschutz</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
