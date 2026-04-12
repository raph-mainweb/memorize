import Link from 'next/link';
import { Heart, BookOpen, Clock, ChevronRight } from 'lucide-react';

export default function HeroSection() {
  return (
    <div className="flex-grow flex flex-col items-center bg-stone-50 overflow-hidden">
      <section className="relative w-full overflow-hidden bg-stone-50">

        {/* ── Background image + white gradient overlay ── */}
        <div className="hero-image hero-gradient absolute inset-0 z-0" />



        {/* ── Hero Text Content ── */}
        <div className="relative z-20 flex flex-col items-center text-center px-4 pt-20 pb-6 max-w-3xl mx-auto">
          <p className="font-script text-brand-primary text-2xl md:text-3xl mb-4 tracking-wide">
            Die moderne Art des Gedenkens
          </p>
          <h1 className="font-heading text-brand-navy text-5xl md:text-7xl leading-[1.1] tracking-tight mb-6">
            Erinnerungen, die{' '}
            <span className="text-brand-primary">niemals verblassen.</span>
          </h1>
          <p className="text-slate-500 text-lg md:text-xl font-light leading-relaxed max-w-xl mb-8">
            Erstelle eine digitale Gedenkseite für einen geliebten Menschen —
            verbunden mit einem eleganten QR-Medaillon am Grabstein. Kostenlos
            starten, für immer online.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/dashboard/neu"
              className="bg-brand-primary text-white font-medium px-7 py-3.5 rounded-full shadow-md hover:brightness-105 hover:-translate-y-0.5 transition"
            >
              Gedenkseite erstellen
            </Link>
            <Link
              href="#medaillon"
              className="bg-[#F5F3FA] text-brand-primary font-medium px-7 py-3.5 rounded-full hover:bg-[#EBE7F5] transition"
            >
              Medallion Shop
            </Link>
          </div>
        </div>

        {/* ── GRID ── */}
        <div className="relative z-20 max-w-6xl mx-auto px-4 pb-20">
          <div className="bento-grid">

            {/* Phone – grid-area: 1/2/5/3 */}
            <div className="phone-holder flex justify-center">
              <img
                src="https://memorial.mainwebsite.ch/wp-content/uploads/2026/04/Ueberschrift-1.png"
                alt="Gedenkseite auf dem Smartphone"
                className="object-contain drop-shadow-2xl"
              />
            </div>

            {/* Card 1 – QR Medaillon */}
            <div className="bentocard card-one">
              <img
                src="https://memorial.mainwebsite.ch/wp-content/uploads/2026/04/memorial-card.png"
                alt="QR Medaillon"
                className="w-full rounded-xl object-cover"
              />
              <div className="bentocard-content text-center">
                <h3 className="font-heading font-semibold text-brand-navy text-lg">QR-Medaillon</h3>
                <p className="text-sm text-slate-500 font-light leading-relaxed">
                  Wetterfest und hochwertig — direkt am Grabstein, der Urne oder einem Gedenktafel anbringen.
                </p>
              </div>

              <div className="card-glow-2" />
            </div>

            {/* Card 2 – Dashboard */}
            <div className="bentocard card-two">
              <div className="bentocard-content text-center">
                <h3 className="font-heading font-semibold text-brand-navy text-lg">Digitale Gedenkseite</h3>
                <p className="text-sm text-slate-500 font-light leading-relaxed">
                  Fotos, Lebensgeschichte, Geburts- und Sterbedatum, Grabadresse und persönliche Erinnerungen — an einem würdevollen Ort online.
                </p>
              </div>
              <img
                src="https://memorial.mainwebsite.ch/wp-content/uploads/2026/04/digitale-gedenkseite-1.png"
                alt="Digitale Gedenkseite Builder"
                className="w-full object-cover object-top"
              />
              <div className="card-glow" />
            </div>


            {/* Card 3 – In 10 Minuten fertig – grid-area: 4/1/5/2 */}
            <div className="card-three">
              <img
                src="/images/startseite/form-ui.png"
                alt=""
                className="w-full card-three-image"
              />

              <div className="card-three-info">

                <div>
                  <h3 className="font-heading font-semibold text-brand-navy text-base leading-tight mb-1">
                    In 10 Minuten fertig
                  </h3>
                  <p className="text-xs text-slate-500 font-light leading-relaxed">
                    Gedenkseite erstellen, Fotos hochladen und Seite freischalten
                  </p>

                </div>


              </div>
            </div>

            {/* Card 4 – Gravestone background – grid-area: 5/1/6/3 */}
            <div
              className="card-four rounded-2xl overflow-hidden relative min-h-[200px] flex items-end"
              style={{
                backgroundImage: "url('https://memorial.mainwebsite.ch/wp-content/uploads/2026/04/memorial-card.png')",
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-[#05123a] via-[#05123a]/60 to-transparent" />
              <div className="relative z-10 p-6">
                <h3 className="text-white font-heading font-medium text-xl mb-1 leading-tight">
                  Ein würdevoller Ort der Erinnerung
                </h3>
                <p className="text-white/70 text-sm font-light">
                  Damit die, die nicht da sein können, trotzdem teilhaben.
                </p>
              </div>
            </div>

            {/* Card 5 – Für immer zugänglich – grid-area: 5/3/6/4 */}
            <div className="card-five card bg-white rounded-2xl border border-slate-100 overflow-hidden relative flex flex-col">
              <div className="card-glow-2 absolute top-[-60px] left-[-60px] w-[280px] h-[280px] rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(5,32,74,0.18) 0%, transparent 65%)' }}
              />
              <div className="overflow-hidden">
                <img
                  src="https://memorial.mainwebsite.ch/wp-content/uploads/2026/04/Generated-Image-April-11-2026-5_21PM-1.jpg"
                  alt="QR Code scannen"
                  className="w-full object-cover"
                />
              </div>
              <div className="p-5 flex flex-col gap-1">
                <h3 className="font-heading font-semibold text-brand-navy text-base">Für immer zugänglich</h3>
                <p className="text-sm text-slate-500 font-light leading-relaxed">
                  Besucher scannen den QR-Code mit dem Handy — keine App, kein Login nötig. Die Gedenkseite öffnet sich sofort.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* ── Global styles for grid + hero overlay ── */}
        <style dangerouslySetInnerHTML={{
          __html: `
        /* Background image with white gradient overlay */
        .hero-image {
          background-image: url('/images/startseite/two-brown-trees.jpg');
          background-size: cover;
          background-position: center top;
        }
        .hero-gradient::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(
            0deg,
            rgba(247, 245, 242, 1) 0%,
            rgba(247, 245, 242, 0.92) 50%,
            rgba(247, 245, 242, 1) 100%
          );
        }

        /* Grid layout — mirrors your Elementor CSS exactly */
        .bento-grid {
          display: grid;
          grid-column-gap: 30px;
          grid-row-gap: 30px;
          grid-template-rows: 0 0 auto auto auto;
          grid-template-columns: 1fr 1fr 1fr;
          grid-auto-rows: 1fr;
          position: relative;
        }
        .phone-holder {
          grid-area: 1 / 2 / 5 / 3;
          align-self: end;
        }
        .card-one {
          grid-area: 3 / 1 / 4 / 2;
          align-self: center;
        }
        .card-two {
          grid-area: 3 / 3 / 5 / 4;
          align-self: center;
        }
        .card-three {
          grid-area: 4 / 1 / 5 / 2;
          align-self: center;
        }
        .card-four {
          grid-area: 5 / 1 / 6 / 3;
          align-self: center;
        }
        .card-five {
          grid-area: 5 / 3 / 6 / 4;
          align-self: center;
        }
      ` }} />
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
      </section >

      {/* Testimonial / Closing CTA */}
      < section className="w-full py-24 md:py-32 bg-white flex flex-col items-center text-center px-6 border-t border-slate-100 relative overflow-hidden" >
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
      </section >


      {/* Modern High-End Footer */}
      < footer className="w-full bg-stone-100 pt-20 pb-10 border-t border-stone-200" >
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
      </footer >
    </div>
  );
}