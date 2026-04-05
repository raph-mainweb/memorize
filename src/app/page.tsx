import Link from 'next/link';
import { ChevronRight, Heart, QrCode, Sparkles, Image as ImageIcon, Shield, BookOpen, Clock } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex-grow flex flex-col items-center bg-stone-50 overflow-hidden">
      

      {/* Hero Section */}
      <section className="relative w-full px-6 lg:px-8 pt-40 pb-20 md:pt-48 md:pb-28 flex flex-col items-center text-center">
        <div className="absolute top-0 w-full h-[80vh] bg-gradient-to-b from-sage-100/30 to-stone-50 -z-20" />
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-sage-200/40 blur-[100px] -z-10 mix-blend-multiply animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] rounded-full bg-stone-200/60 blur-[80px] -z-10 mix-blend-multiply animate-pulse" style={{ animationDuration: '10s' }} />

        <div className="max-w-4xl animate-fade-in relative z-10 flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-md border border-white/80 shadow-sm mb-8 text-sm text-sage-700 font-medium tracking-wide">
            <Sparkles className="w-4 h-4" />
            <span className="uppercase text-xs tracking-widest">Die moderne Art des Gedenkens</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif text-slate-900 mb-8 leading-[1.1] tracking-tight">
            Erinnerungen, die <br className="hidden md:block" />
            <span className="italic text-sage-600">niemals verblassen.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed font-light">
            Schaffe einen würdevollen, digitalen Ort für die Erinnerung an deine Liebsten. 
            Direkt am Grab zugänglich durch unser wetterfestes QR-Medaillon.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full md:w-auto animate-slide-up opacity-0" style={{ animationFillMode: 'forwards', animationDelay: '0.2s' }}>
            <Link href="/dashboard/neu" className="w-full sm:w-auto bg-slate-900 text-white px-8 py-4 rounded-full font-medium hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-900/10 hover:shadow-2xl hover:shadow-slate-900/20 hover:-translate-y-1">
               Kostenlos beginnen
              <ChevronRight className="w-5 h-5 opacity-80" />
            </Link>
            <Link href="#medaillon" className="w-full sm:w-auto bg-white/80 backdrop-blur-sm border border-slate-200 text-slate-800 px-8 py-4 rounded-full font-medium hover:bg-white transition-all flex items-center justify-center shadow-sm hover:shadow-md hover:-translate-y-1">
              Das Medaillon entdecken
            </Link>
          </div>
        </div>
      </section>

      {/* The Medallion Showcase (Placeholder) */}
      <section id="medaillon" className="w-full py-24 md:py-32 bg-slate-900 text-white relative flex flex-col items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-slate-950"></div>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 w-full relative z-10">
          <div className="grid md:grid-cols-2 gap-16 lg:gap-24 items-center">
            
            {/* Image Placeholder */}
            <div className="relative w-full aspect-square rounded-3xl overflow-hidden bg-slate-800/50 flex items-center justify-center border border-slate-700 shadow-2xl backdrop-blur-sm group">
              <div className="absolute inset-0 bg-gradient-to-tr from-slate-800/80 to-slate-700/20 transition-opacity group-hover:opacity-80"></div>
              
              {/* Product image placeholder */}
              <div className="relative z-10 flex flex-col items-center text-slate-400">
                <ImageIcon className="w-20 h-20 mb-6 opacity-30 group-hover:opacity-60 transition-opacity group-hover:scale-110 duration-500" />
                <span className="font-mono text-sm tracking-widest uppercase text-slate-300">Produktaufnahme Medaillon</span>
                <span className="text-xs opacity-50 mt-3 text-center max-w-xs px-4">Hier steht das hochwertige Produktbild oder das interaktive 3D-Modell im Fokus.</span>
              </div>
              
              {/* Decorative lighting elements */}
              <div className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full bg-sage-500/20 shadow-[0_0_80px_rgba(138,148,136,0.3)] blur-2xl"></div>
              <div className="absolute bottom-1/4 right-1/4 w-40 h-40 rounded-full bg-white/10 blur-3xl"></div>
            </div>

            {/* Text Content */}
            <div className="flex flex-col">
              <div className="inline-flex items-center gap-2 mb-6 text-sage-400">
                <div className="w-8 h-[1px] bg-sage-400/50"></div>
                <span className="text-sm font-medium tracking-widest uppercase text-sage-400">Qualität aus der Schweiz</span>
              </div>
              <h3 className="text-4xl md:text-5xl lg:text-6xl font-serif mb-8 leading-[1.1] text-white">
                Ein zeitloses Zeichen <br />der Verbundenheit.
              </h3>
              <p className="text-slate-300 text-lg md:text-xl mb-10 leading-relaxed font-light">
                Unser QR-Medaillon wird aus hochwertigem, wetterfestem Material gefertigt und fügt sich dezent in jede Grabgestaltung ein. Ein einfacher Scan mit dem Smartphone öffnet die dazugehörige Gedenkseite.
              </p>
              
              <ul className="space-y-8">
                <li className="flex items-start gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center flex-shrink-0 shadow-inner">
                    <Shield className="w-6 h-6 text-sage-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-white text-lg mb-1">Wetterfest & Langlebig</h4>
                    <p className="text-slate-400 text-base leading-relaxed">Entwickelt für die Ewigkeit. Das Medaillon hält UV-Strahlung, Frost und jedem Wetter problemlos stand.</p>
                  </div>
                </li>
                <li className="flex items-start gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center flex-shrink-0 shadow-inner">
                    <QrCode className="w-6 h-6 text-sage-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-white text-lg mb-1">Universell kompatibel</h4>
                    <p className="text-slate-400 text-base leading-relaxed">Der QR-Code funktioniert intuitiv mit jedem zukunftsfähigen Smartphone – ganz ohne vorherige App-Installation.</p>
                  </div>
                </li>
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="w-full bg-stone-50 py-24 md:py-32 relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-20 md:mb-28">
            <h2 className="text-4xl md:text-5xl font-serif text-slate-900 mb-6 tracking-tight">Der Weg zur Gedenkseite</h2>
            <p className="text-slate-600 font-light text-lg md:text-xl">
              Ein transparenter, müheloser Prozess, um einen unvergesslichen Ort der Erinnerung zu schaffen.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-12 relative">
            {/* Connecting line for desktop */}
            <div className="hidden md:block absolute top-[4.5rem] left-[15%] right-[15%] h-[1px] bg-gradient-to-r from-transparent via-slate-200 to-transparent z-0"></div>

            {/* Step 1 */}
            <div className="relative z-10 flex flex-col items-center text-center p-8 lg:p-10 bg-white/70 backdrop-blur-md rounded-3xl hover:-translate-y-2 transition-all duration-500 shadow-sm hover:shadow-xl border border-white">
              <div className="w-20 h-20 bg-stone-50 rounded-2xl flex items-center justify-center mb-8 shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
                <BookOpen className="w-8 h-8 text-sage-600" />
              </div>
              <h3 className="text-2xl font-serif text-slate-900 mb-4">1. Seite gestalten</h3>
              <p className="text-slate-500 leading-relaxed font-light">
                Erstelle kostenlos eine wunderschöne Online-Vorschau. Lade ausgewählte Fotos hoch und verfasse eine würdevolle Biografie.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative z-10 flex flex-col items-center text-center p-8 lg:p-10 bg-white/70 backdrop-blur-md rounded-3xl hover:-translate-y-2 transition-all duration-500 shadow-sm hover:shadow-xl border border-white md:translate-y-12">
              <div className="w-20 h-20 bg-stone-50 rounded-2xl flex items-center justify-center mb-8 shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
                <Heart className="w-8 h-8 text-sage-600" />
              </div>
              <h3 className="text-2xl font-serif text-slate-900 mb-4">2. Freischalten</h3>
              <p className="text-slate-500 leading-relaxed font-light">
                Aktiviere die Seite für einmalig 49 CHF. Keine Abos und keine versteckten Kosten. Die Erinnerung bleibt dauerhaft erhalten.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative z-10 flex flex-col items-center text-center p-8 lg:p-10 bg-white/70 backdrop-blur-md rounded-3xl hover:-translate-y-2 transition-all duration-500 shadow-sm hover:shadow-xl border border-white">
              <div className="w-20 h-20 bg-stone-50 rounded-2xl flex items-center justify-center mb-8 shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
                <Clock className="w-8 h-8 text-sage-600" />
              </div>
              <h3 className="text-2xl font-serif text-slate-900 mb-4">3. Medaillon erhalten</h3>
              <p className="text-slate-500 leading-relaxed font-light">
                Das fest mit der Seite verknüpfte QR-Medaillon wird direkt nach der Freischaltung am gleichen Tag per A-Post versandt.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Testimonial / Closing CTA */}
      <section className="w-full py-24 md:py-32 bg-white flex flex-col items-center text-center px-6 border-t border-slate-100 relative overflow-hidden">
        <div className="absolute top-[-50%] right-[-10%] w-[500px] h-[500px] rounded-full bg-sage-50/50 blur-[100px] -z-10" />
        
        <div className="max-w-3xl">
          <Heart className="w-12 h-12 text-sage-300 mx-auto mb-10" />
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif text-slate-900 mb-8 leading-tight tracking-tight">
            Beginne jetzt, <br/><span className="italic">ohne Verpflichtungen.</span>
          </h2>
          <p className="text-slate-500 text-lg md:text-xl mb-12 max-w-2xl mx-auto font-light leading-relaxed">
            Die Erstellung und Gestaltung der Gedenkseite ist komplett kostenlos. Nimm dir die Zeit, die du brauchst, und bezahle erst, wenn du bereit bist, die Seite zu veröffentlichen.
          </p>
          <Link href="/dashboard/neu" className="inline-flex bg-slate-900 text-white px-10 py-5 rounded-full font-medium hover:bg-slate-800 transition-all items-center justify-center gap-3 shadow-xl hover:shadow-2xl hover:-translate-y-1 text-lg">
            Gedenkseite eröffnen
            <ChevronRight className="w-5 h-5 opacity-70" />
          </Link>
        </div>
      </section>

      {/* Modern High-End Footer */}
      <footer className="w-full bg-stone-100 pt-20 pb-10 border-t border-stone-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 lg:gap-16 mb-16">
            <div className="md:col-span-2">
              <div className="font-serif text-2xl font-bold tracking-tight text-slate-900 mb-6">
                Nachklang <span className="text-sage-500 font-normal italic">CH</span>
              </div>
              <p className="text-slate-500 max-w-sm font-light leading-relaxed">
                Der würdevolle, Schweizer Weg, die wertvollsten Erinnerungen an für immer geliebte Menschen und Tiere zu bewahren.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-slate-900 mb-6 uppercase tracking-wider text-sm">Plattform</h4>
              <ul className="space-y-4 text-sm text-slate-500">
                <li><Link href="/" className="hover:text-sage-600 transition-colors">Startseite</Link></li>
                <li><Link href="#so-funktioniert" className="hover:text-sage-600 transition-colors">So funktioniert es</Link></li>
                <li><Link href="/auth/login" className="hover:text-sage-600 transition-colors">Login / Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-slate-900 mb-6 uppercase tracking-wider text-sm">Rechtliches</h4>
              <ul className="space-y-4 text-sm text-slate-500">
                <li><Link href="/impressum" className="hover:text-sage-600 transition-colors">Impressum</Link></li>
                <li><Link href="/datenschutz" className="hover:text-sage-600 transition-colors">Datenschutz</Link></li>
                <li><Link href="/agb" className="hover:text-sage-600 transition-colors">AGB</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row items-center justify-between text-slate-400 text-sm pt-8 border-t border-stone-200">
            <div>© {new Date().getFullYear()} Nachklang CH. Alle Rechte vorbehalten.</div>
            <div className="flex items-center gap-2 mt-4 md:mt-0">
               <span className="text-slate-400">Design & Entwicklung in der Schweiz</span>
               <span>🇨🇭</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

