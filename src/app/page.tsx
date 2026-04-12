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
          <p className="subtitle">
            Die moderne Art des Gedenkens
          </p>
          <h1 className="font-heading font-medium text-brand-navy tracking-tight mb-4">
            Erinnerungen, die{' '}
            <span className="text-brand-primary">niemals verblassen.</span>
          </h1>
          <p className="text-slate-500 text-lg md:text-xl font-light leading-relaxed mb-8">
            Erstelle eine digitale Gedenkseite für einen geliebten Menschen —
            verbunden mit einem eleganten QR-Medaillon am Grabstein. Kostenlos
            starten, für immer online.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/dashboard/neu"
              className="btn btn-primary"
            >
              Gedenkseite erstellen
            </Link>
            <Link
              href="#medaillon"
              className="btn btn-secondary"
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
                src="/images/startseite/phone-mockup.png"
                alt="Gedenkseite auf dem Smartphone"
                className="object-contain drop-shadow-2xl"
              />
            </div>

            {/* Card 1 – QR Medaillon */}
            <div className="bentocard card-one">
              <img
                src="/images/startseite/memorial-card.png"
                alt="QR Medaillon"
                className="w-full rounded-xl object-cover"
              />
              <div className="bentocard-content text-center">
                <h3 className="font-heading font-medium text-brand-navy text-2xl mb-2">QR-Medaillon</h3>
                <p className="text-small text-slate-500 font-light leading-relaxed">
                  Wetterfest und hochwertig — direkt am Grabstein, der Urne oder einem Gedenktafel anbringen.
                </p>
              </div>

              <div className="card-glow-2" />
            </div>

            {/* Card 2 – Dashboard */}
            <div className="bentocard card-two">
              <div className="bentocard-content text-center">
                <h3 className="font-heading font-medium text-brand-navy text-2xl mb-2">Digitale Gedenkseite</h3>
                <p className="text-small text-slate-500 font-light leading-relaxed">
                  Fotos, Lebensgeschichte, Geburts- und Sterbedatum, Grabadresse und persönliche Erinnerungen — an einem würdevollen Ort online.
                </p>
              </div>
              <img
                src="/images/startseite/builder-macbook.png"
                alt="Digitale Gedenkseite Builder"
                className="w-full object-cover object-top"
              />
              <div className="card-glow"></div>
            </div>


            {/* Card 3 – In 10 Minuten fertig – grid-area: 4/1/5/2 */}
            <div className="card-three">
              <img
                src="/images/startseite/form-ui.png"
                alt=""
                className="w-full card-three-image"
              />

              <div className="card-three-info">
                <img
                  src="/images/startseite/hourglass.svg"
                  alt="Hourglass" width="30px" height="30px"
                />

                <div>
                  <h3 className="font-heading font-semibold text-white text-base leading-tight mb-1">
                    In 10 Minuten fertig
                  </h3>
                  <p className="text-xs text-white font-light leading-relaxed">
                    Gedenkseite erstellen, Fotos hochladen und Seite freischalten
                  </p>

                </div>


              </div>
            </div>

            {/* Card 4 – Gravestone background – grid-area: 5/1/6/3 */}
            <div
              className="card-four"
            >
              <div className="card-four-content">
                <h3 className="text-white font-heading font-medium text-3xl mb-1 leading-tight">
                  Ein würdevoller Ort der Erinnerung
                </h3>
                <p className="text-white/70 text-base  font-light">
                  Damit die, die nicht da sein können, trotzdem teilhaben.
                </p>
              </div>
            </div>


            {/* Card 5 – Für immer zugänglich – grid-area: 5/3/6/4 */}
            <div className="card-five bentocard">
              <img
                src="https://memorial.mainwebsite.ch/wp-content/uploads/2026/04/Generated-Image-April-11-2026-5_21PM-1.jpg"
                alt="QR Code scannen"
                className="w-full object-cover" />
              <div className="bentocard-content text-center">
                <h3 className="font-heading font-medium text-brand-navy text-2xl mb-2">Für immer zugänglich</h3>
                <p className="text-small text-slate-500 font-light leading-relaxed">
                  Besucher scannen den QR-Code mit dem Handy — keine App, kein Login nötig. Die Gedenkseite öffnet sich sofort.
                </p>
              </div>
              <div className="card-glow-2"></div>
            </div>

          </div>
        </div>

        {/* ── Global styles for grid + hero overlay ── */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
      .hero-image {
        background-image: url('/images/startseite/two-brown-trees.jpg');
        background-size: cover;
        background-position: center top;
      }

      .hero-gradient::before {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(0deg, rgb(255 255 255) 0%, rgb(255 255 255 / 93%) 50%, rgb(255 255 255) 100%)
        ;
      }

      /* Mobile first */
      .bento-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 20px;
        position: relative;
      }

      .bentocard {
        background: white;
        border: 1px solid #ddd;
        border-radius: 15px;
        overflow: hidden;
      }

      .bentocard-content {
        padding: 20px;
      }

      .text-small {
        font-size: 16px;
        line-height: 1.4em;
      }

      .phone-holder,
      .card-one,
      .card-two,
      .card-three,
      .card-four,
      .card-five {
        grid-area: auto;
        margin-top: 0;
        align-self: stretch;
      }

      .phone-holder {
        order: 1;
      }

      .card-one {
        order: 2;
      }

      .card-two {
        order: 3;
      }

      .card-three {
        order: 4;
        padding: 0;
        position: relative;
        border-radius: 15px;
        overflow: hidden;
      }

      img.w-full.card-three-image {
        border-radius: 15px;
        box-shadow: -5px -3px 15px 1px rgb(0 0 0 / 2%);
      }

      .card-three-info {
        position: absolute;
        left: 12px;
        right: 12px;
        bottom: 12px;
        top: auto;
        background: #968cb5d9;
        z-index: 1;
        padding: 12px;
        border-radius: 8px;
        display: flex;
        gap: 10px;
        align-items: flex-start;
        width: auto;
      }

      .card-four {
        order: 5;
        min-height: 260px;
        background-image: url('/images/startseite/Banner-4-Stones.webp');
        background-size: cover;
        background-position: center;
        position: relative;
        border-radius: 15px;
        overflow: hidden;
      }

      .card-four:before {
        background-image: linear-gradient(180deg, #02010100 44%, #222222 100%);
        content: "";
        width: 100%;
        height: 100%;
        position: absolute;
        inset: 0;
      }

      .card-four-content {
        position: absolute;
        bottom: 0;
        width: 100%;
        padding: 20px;
      }

      .card-five {
        order: 6;
      }

      .phone-holder img {
        width: 100%;
        max-width: 340px;
        height: auto;
      }

      .card-one img,
      .card-two img,
      .card-five img {
        width: 100%;
        height: auto;
        display: block;
      }

      /* Tablet */
      @media (min-width: 768px) {
        .bento-grid {
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        .phone-holder {
          grid-column: span 2;
          display: flex;
          justify-content: center;
        }

        .phone-holder img {
          max-width: 420px;
        }

        .card-four {
          min-height: 320px;
        }

        .card-four-content {
          padding: 24px;
        }
      }

      /* Desktop */
      @media (min-width: 1024px) {
        .bento-grid {
          grid-column-gap: 30px;
          grid-row-gap: 30px;
          grid-template-rows: 0 0 auto auto auto;
          grid-template-columns: 1fr 1fr 1fr;
          grid-auto-rows: 1fr;
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
          padding: 20px 0 0 30px;
          position: relative;
          border-radius: 0;
          overflow: visible;
        }

        img.w-full.card-three-image {
          border-radius: 10px 0 0 10px;
        }

        .card-three-info {
          position: absolute;
          top: 50px;
          left: 0;
          right: auto;
          bottom: auto;
          width: 90%;
        }

        .card-four {
          grid-area: 5 / 1 / 6 / 3;
          align-self: center;
          padding-bottom: 52%;
          min-height: auto;
        }

        .card-four-content {
          padding: 30px;
        }

        .card-five {
          grid-area: 5 / 3 / 6 / 4;
          align-self: center;
          margin-top: -140px;
        }

        .phone-holder img {
          max-width: 100%;
        }
      }
    `,
          }}
        />
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