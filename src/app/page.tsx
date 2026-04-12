import Link from 'next/link';
import { ChevronRight, Heart, QrCode, Sparkles, Image as ImageIcon, Shield, BookOpen, Clock } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex-grow flex flex-col items-center bg-stone-50 overflow-hidden">



      {/* Hero Section */}
      <section className="relative w-full px-4 pt-32 pb-16 md:pt-48 md:pb-24 flex flex-col items-center text-center bg-stone-50 overflow-visible z-10">
        
        {/* Subtle background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-brand-primary/10 blur-[120px] -z-10 pointer-events-none" />

        <div className="max-w-4xl relative z-10 flex flex-col items-center animate-fade-in">
          
          <h2 className="subtitle text-brand-primary mb-6 tracking-wide opacity-90">
            Die moderne Art des Gedenkens
          </h2>

          <h1 className="text-5xl md:text-7xl lg:text-[5rem] font-serif text-brand-navy mb-8 leading-[1.1] tracking-tight">
            Erinnerungen, die <br className="hidden md:block" />
            <span className="text-brand-primary/90 opacity-90">niemals verblassen.</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed font-light">
            Erstelle eine digitale Gedenkseite für einen geliebten Menschen — <br className="hidden md:block"/>
            verbunden mit einem eleganten QR-Medaillon am Grabstein. Kostenlos <br className="hidden md:block"/>
            starten, für immer online.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full md:w-auto">
            <Link 
              href="/dashboard/neu" 
              className="w-full sm:w-auto bg-brand-primary text-white font-medium px-8 py-4 rounded-full transition shadow-md hover:shadow-xl hover:brightness-105 hover:-translate-y-0.5"
            >
              Gedenkseite erstellen
            </Link>
            <Link 
              href="#medaillon" 
              className="w-full sm:w-auto bg-[#F5F3FA] text-brand-primary font-medium px-8 py-4 rounded-full transition hover:bg-[#EBE7F5]"
            >
              Medaillon Shop
            </Link>
          </div>
        </div>
      </section>

      {/* The Asymmetric Grid Layout from Figma */}
      <section className="w-full max-w-7xl mx-auto px-6 lg:px-8 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 auto-rows-min items-stretch">
          
          {/* Left Column (col-span-4) */}
          <div className="lg:col-span-4 flex flex-col gap-6 lg:gap-8 lg:mt-12 justify-center">
            
            {/* Top Left: QR-Medaillon Card (White) */}
            <div className="bg-white rounded-[32px] p-8 shadow-sm hover:shadow-md transition-shadow border border-slate-100 flex flex-col items-center text-center relative overflow-hidden h-[340px]">
              {/* Product mockups space */}
              <div className="w-full flex-grow relative mb-4">
                 <div className="absolute top-[-10px] left-1/2 -translate-x-1/2 w-[180px] h-[140px] bg-brand-navy rounded-2xl rotate-[-8deg] shadow-lg flex items-center justify-center px-4">
                    <span className="text-white text-xs font-mono font-bold tracking-widest opacity-80">QR-CODE MOCKUP</span>
                 </div>
                 {/* Floating Form UI if exists */}
                 <div className="absolute bottom-[-15px] left-1/2 -translate-x-1/2 w-[220px] shadow-2xl rounded-xl z-20">
                   <div className="bg-[#EBE7F5] border border-white p-3 rounded-xl shadow-lg border-opacity-50">
                     <p className="text-[10px] font-bold text-brand-primary text-left">In 10 Minuten fertig</p>
                     <p className="text-[8px] text-brand-primary/70 text-left mt-0.5">Gedenkseite erstellen, Foto hochladen und Seite fixieren</p>
                   </div>
                 </div>
              </div>
              
              <h3 className="font-semibold text-brand-navy text-lg mb-2 relative z-10">QR-Medaillon</h3>
              <p className="text-xs text-slate-500 relative z-10 leading-relaxed font-light">Wetterfest und hochwertig — direkt am Grabstein, der Urne oder einem Gedenktafel anbringen.</p>
            </div>

            {/* Bottom Left: Gravestones (Image) */}
            <div className="bg-stone-900 rounded-[32px] shadow-sm overflow-hidden relative h-[260px] group">
              <div className="absolute inset-0 w-full h-full bg-slate-800">
                <Image src="/images/startseite/gravestones.png" alt="Grabsteine" fill className="object-cover opacity-60 group-hover:opacity-70 transition-opacity duration-700 blur-[2px]" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>
              </div>
              <div className="absolute bottom-0 left-0 p-8 w-full z-10">
                <h3 className="text-white font-medium text-xl mb-1.5 leading-tight">Ein würdevoller Ort der Erinnerung</h3>
                <p className="text-white/70 text-xs font-light">Damit die, die nicht da sein können, trotzdem teilhaben.</p>
              </div>
            </div>

          </div>

          {/* Center Column: Phone Mockup (col-span-4) */}
          <div className="lg:col-span-4 flex justify-center items-center h-full max-h-[700px]">
            <div className="relative w-full max-w-[320px] aspect-[1/2.1] rounded-[38px] shadow-[0_30px_60px_rgba(0,0,0,0.15)] border-[6px] border-black bg-white overflow-hidden transform hover:-translate-y-2 transition-transform duration-500 ease-out mx-auto">
              {/* Top Notch Area */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[40%] h-[20px] bg-black rounded-b-xl z-20"></div>
              
              {/* The Phone Screen */}
              <div className="relative w-full h-full bg-stone-50 overflow-hidden">
                <Image 
                  src="/images/startseite/phone-mockup.png" 
                  alt="Gedenkseite auf dem Smartphone" 
                  fill 
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </div>

          {/* Right Column (col-span-4) */}
          <div className="lg:col-span-4 flex flex-col gap-6 lg:gap-8 lg:mt-12 justify-center">
            
            {/* Top Right: Digitale Gedenkseite Card */}
            <div className="bg-white rounded-[32px] p-8 shadow-sm hover:shadow-md transition-shadow border border-slate-100 relative overflow-hidden h-[340px]">
              <h3 className="font-semibold text-brand-navy text-lg mb-2 relative z-10 text-center">Digitale Gedenkseite</h3>
              <p className="text-xs text-slate-500 mb-6 text-center relative z-10 font-light leading-relaxed">
                Fotos, Lebensgeschichte, Geburts- und Sterbedatum, Grabadresse und persönliche Erinnerungen — an einem würdevollen Ort online.
              </p>
              
              {/* Macbook / Builder mockup */}
              <div className="absolute bottom-[-10px] left-0 right-0 h-[200px] flex justify-center flex-col items-center">
                 <div className="relative w-[110%] h-[200px] translate-x-[5%] rotate-[-12deg]">
                   <Image 
                     src="/images/startseite/builder-macbook.png" 
                     alt="Builder Interface" 
                     fill 
                     className="object-contain object-bottom drop-shadow-2xl opacity-90" 
                   />
                 </div>
              </div>
            </div>

            {/* Bottom Right: Scanning Phone */}
            <div className="bg-white rounded-[32px] shadow-sm hover:shadow-md transition-shadow border border-slate-100 flex flex-col h-[260px] overflow-hidden">
              <div className="relative h-[140px] w-full bg-stone-100 flex-shrink-0 flex items-center justify-center">
                <div className="absolute inset-0 opacity-80" style={{ backgroundImage: "linear-gradient(#eae6f4 1px, transparent 1px), linear-gradient(90deg, #eae6f4 1px, transparent 1px)", backgroundSize: "20px 20px"}}></div>
                <Image 
                  src="/images/startseite/scan-mockup.png" 
                  alt="QR Code Scan" 
                  fill 
                  className="object-contain p-4 mix-blend-multiply" 
                />
              </div>
              <div className="px-6 py-5 text-center flex-grow flex flex-col justify-center">
                <h3 className="font-semibold text-brand-navy text-base mb-1">Für immer zugänglich</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-light">Besucher scannen den QR-Code mit dem Handy — keine App, kein Login nötig. Die Gedenkseite öffnet sich sofort.</p>
              </div>
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
            Beginne jetzt, <br /><span className="italic">ohne Verpflichtungen.</span>
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

