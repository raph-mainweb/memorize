import Link from 'next/link';
import { Heart, ChevronRight, PenLine, Lock, Wifi, CheckCircle2 } from 'lucide-react';
import { getAppProducts } from '@/lib/shopify/products';

export default async function HeroSection() {
  const products = await getAppProducts();
  return (
    <div className="flex-grow flex flex-col items-center bg-white overflow-hidden">
      <section className="relative w-full overflow-hidden">

        {/* ── Background image + white gradient overlay ── */}
        <div className="hero-image hero-gradient absolute inset-0 z-0" />

        {/* ── Hero Text Content ── */}
        <div className="relative z-20 flex flex-col items-center text-center px-4 pt-20 pb-6 max-w-3xl mx-auto">
          <p className="subtitle">Die moderne Art des Gedenkens</p>
          <h1 className="h1 font-heading font-medium text-brand-navy tracking-tight mb-4">
            Erinnerungen, die{' '}
            <span className="text-brand-primary">niemals verblassen.</span>
          </h1>
          <p className="text-slate-500 text-lg md:text-xl font-light leading-relaxed mb-8">
            Erstelle eine digitale Gedenkseite für einen geliebten Menschen —
            verbunden mit einem eleganten QR-Medaillon am Grabstein. Kostenlos
            starten, für immer online.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/dashboard/neu" className="btn btn-primary">Gedenkseite erstellen</Link>
            <Link href="#medaillon" className="btn btn-secondary">Medallion Shop</Link>
          </div>
        </div>

        {/* ── GRID ── */}
        <div className="relative z-20 max-w-6xl mx-auto px-4 pb-20">
          <div className="bento-grid">

            <div className="phone-holder flex justify-center">
              <img src="/images/startseite/phone-mockup.png" alt="Gedenkseite auf dem Smartphone" className="object-contain drop-shadow-2xl" />
            </div>

            <div className="bentocard card-one">
              <img src="/images/startseite/memorial-card.png" alt="QR Medaillon" className="w-full rounded-xl object-cover" style={{ zIndex: 3, position: 'relative' }} />
              <div className="bentocard-content text-center">
                <h3 className="font-heading font-medium text-brand-navy text-2xl mb-2">QR-Medaillon</h3>
                <p className="text-small text-slate-500 font-light leading-relaxed">Wetterfest und hochwertig — direkt am Grabstein, der Urne oder einem Gedenktafel anbringen.</p>
              </div>
              <div className="card-glow-2" />
            </div>

            <div className="bentocard card-two">
              <div className="bentocard-content text-center">
                <h3 className="font-heading font-medium text-brand-navy text-2xl mb-2">Digitale Gedenkseite</h3>
                <p className="text-small text-slate-500 font-light leading-relaxed">Fotos, Lebensgeschichte, Geburts- und Sterbedatum, Grabadresse und persönliche Erinnerungen — an einem würdevollen Ort online.</p>
              </div>
              <img src="/images/startseite/builder-macbook.png" alt="Digitale Gedenkseite Builder" className="w-full object-cover object-top" style={{ zIndex: 3, position: 'relative' }} />
              <div className="card-glow" />
            </div>

            <div className="card-three">
              <img src="/images/startseite/form-ui.png" alt="" className="w-full card-three-image" />
              <div className="card-three-info">
                <img src="/images/startseite/hourglass.svg" alt="Hourglass" width="30px" height="30px" />
                <div>
                  <h3 className="font-heading font-semibold text-white text-base leading-tight mb-1">In 10 Minuten fertig</h3>
                  <p className="text-xs text-white font-light leading-relaxed">Gedenkseite erstellen, Fotos hochladen und Seite freischalten</p>
                </div>
              </div>
            </div>

            <div className="card-four">
              <div className="card-four-content">
                <h3 className="text-white font-heading font-medium text-3xl mb-1 leading-tight">Ein würdevoller Ort der Erinnerung</h3>
                <p className="text-white/70 text-base font-light">Damit die, die nicht da sein können, trotzdem teilhaben.</p>
              </div>
            </div>

            <div className="card-five bentocard">
              <img src="https://memorial.mainwebsite.ch/wp-content/uploads/2026/04/Generated-Image-April-11-2026-5_21PM-1.jpg" alt="QR Code scannen" className="w-full object-cover" />
              <div className="bentocard-content text-center">
                <h3 className="font-heading font-medium text-brand-navy text-2xl mb-2">Für immer zugänglich</h3>
                <p className="text-small text-slate-500 font-light leading-relaxed">Besucher scannen den QR-Code mit dem Handy — keine App, kein Login nötig. Die Gedenkseite öffnet sich sofort.</p>
              </div>
              <div className="card-glow-2" />
            </div>

          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          SO FUNKTIONIERT ES
      ════════════════════════════════════════════════ */}
      <section className="w-full bg-secondary py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">

          <div className="max-w-2xl mb-10 md:mb-10">
            <h2 className="h2 font-heading font-medium text-brand-navy tracking-tight mb-4">So funktioniert Your Memorial</h2>
            <p className="text-slate-600 font-light text-lg md:text-xl">
              Der Ablauf ist bewusst einfach gehalten. So finden Angehörige schnell den richtigen Weg — ob für eine eigene Gedenkseite oder für ein Medaillon als Geschenk.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

            {/* Step 1 */}
            <div className="relative flex flex-col border border-slate-200 rounded-2xl p-7 bg-white overflow-hidden">
              <div className="flex items-start justify-between mb-6">
                <div className="w-10 h-10 rounded-xl border border-slate-200 bg-stone-50 flex items-center justify-center flex-shrink-0">
                  <PenLine className="w-5 h-5 text-slate-500" />
                </div>
                <span className="font-heading font-bold select-none" style={{ fontSize: 64, lineHeight: 1, letterSpacing: '-0.04em', color: '#e2e8f0' }}>
                  01
                </span>
              </div>
              <h3 className="font-heading font-semibold text-brand-navy text-lg leading-snug mb-3">
                Gedenkseite erstellen
              </h3>
              <p className="text-slate-500 font-light text-sm leading-relaxed flex-grow mb-6">
                Fotos hochladen, Lebensgeschichte schreiben, Geburts- und Sterbedatum eintragen. Völlig kostenlos — keine Kreditkarte nötig.
              </p>
              <span className="self-start text-xs font-medium px-3 py-1.5 rounded-full" style={{ background: '#dcfce7', color: '#166534' }}>
                Kostenlos starten
              </span>
            </div>

            {/* Step 2 */}
            <div className="relative flex flex-col border border-slate-200 rounded-2xl p-7 bg-white overflow-hidden">
              <div className="flex items-start justify-between mb-6">
                <div className="w-10 h-10 rounded-xl border border-slate-200 bg-stone-50 flex items-center justify-center flex-shrink-0">
                  <Lock className="w-5 h-5 text-slate-500" />
                </div>
                <span className="font-heading font-bold select-none" style={{ fontSize: 64, lineHeight: 1, letterSpacing: '-0.04em', color: '#e2e8f0' }}>
                  02
                </span>
              </div>
              <h3 className="font-heading font-semibold text-brand-navy text-lg leading-snug mb-3">
                Seite freischalten & Medaillon bestellen
              </h3>
              <p className="text-slate-500 font-light text-sm leading-relaxed flex-grow mb-6">
                CHF 49 — einmalig. Deine Seite wird öffentlich. Optional kannst du direkt ein hochwertiges QR-Medaillon dazu bestellen — alles in einem Schritt.
              </p>
              <span className="self-start text-xs font-medium px-3 py-1.5 rounded-full" style={{ background: '#ede8f7', color: '#5b21b6' }}>
                Einmalig CHF 49.–
              </span>
            </div>

            {/* Step 3 */}
            <div className="relative flex flex-col border border-slate-200 rounded-2xl p-7 bg-white overflow-hidden">
              <div className="flex items-start justify-between mb-6">
                <div className="w-10 h-10 rounded-xl border border-slate-200 bg-stone-50 flex items-center justify-center flex-shrink-0">
                  <Wifi className="w-5 h-5 text-slate-500" />
                </div>
                <span className="font-heading font-bold select-none" style={{ fontSize: 64, lineHeight: 1, letterSpacing: '-0.04em', color: '#e2e8f0' }}>
                  03
                </span>
              </div>
              <h3 className="font-heading font-semibold text-brand-navy text-lg leading-snug mb-3">
                Anbringen & für immer teilen
              </h3>
              <p className="text-slate-500 font-light text-sm leading-relaxed flex-grow mb-6">
                Das Medaillon kommt per Post. Anbringen, fertig. Besucher scannen den QR-Code und landen sofort auf der Gedenkseite — keine App, kein Login nötig.
              </p>
              <span className="self-start text-xs font-medium px-3 py-1.5 rounded-full" style={{ background: '#dbeafe', color: '#1e40af' }}>
                Für immer online
              </span>
            </div>

          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          PRODUKTE / MEDAILLON SHOP
      ════════════════════════════════════════════════ */}
      <section id="medaillon" className="w-full py-20 md:py-32 bg-stone-50 border-t border-slate-100 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[400px] bg-brand-primary/5 blur-[120px] pointer-events-none rounded-full" />
        
        <div className="max-w-6xl mx-auto px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="h2 font-heading font-medium text-brand-navy tracking-tight mb-4">Das Nachklang QR-Medaillon</h2>
            <p className="text-slate-500 font-light text-lg md:text-xl">
              Hochwertig, wetterfest und diskret. Die physische Brücke zur digitalen Gedenkseite deines Liebsten.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {products.map((product) => {
              const imgUrl = product.images[0]?.url || '/images/startseite/memorial-card.png';
              
              return (
                <div key={product.id} className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-brand-900/5 overflow-hidden flex flex-col group hover:-translate-y-1 transition-all duration-300">
                  
                  <div className="w-full bg-stone-100 flex items-center justify-center p-10 relative overflow-hidden h-64">
                     <div className="absolute inset-0 bg-gradient-to-tr from-brand-secondary/40 to-brand-primary/10 opacity-60 group-hover:opacity-100 transition-opacity"></div>
                     <img src={imgUrl} alt={product.title} className="relative z-10 w-full max-w-[160px] drop-shadow-xl rounded-2xl group-hover:scale-105 transition-transform duration-500" />
                  </div>

                  <div className="p-8 flex flex-col flex-grow">
                    {product.badge && (
                      <div className="inline-flex self-start items-center gap-2 px-3 py-1.5 rounded-full bg-brand-50 text-brand-primary text-xs font-semibold uppercase tracking-wider mb-4 border border-brand-100/50">
                        {product.badge}
                      </div>
                    )}
                    <h3 className="text-2xl font-heading font-medium text-brand-navy mb-3">{product.title}</h3>
                    <p className="text-slate-500 font-light text-sm leading-relaxed mb-6 flex-grow">
                      {product.shortDescription || 'Ein würdevolles Andenken für die Ewigkeit.'}
                    </p>

                    <ul className="space-y-3 mb-8">
                      {product.iconText1 && (
                        <li className="flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" />
                          <span className="text-slate-600 font-light text-sm">{product.iconText1}</span>
                        </li>
                      )}
                      {product.iconText2 && (
                        <li className="flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" />
                          <span className="text-slate-600 font-light text-sm">{product.iconText2}</span>
                        </li>
                      )}
                      {/* Generelle Fallbacks, falls Metafelder leer sind */}
                      {!product.iconText1 && !product.iconText2 && (
                        <>
                          <li className="flex items-start gap-3">
                            <CheckCircle2 className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" />
                            <span className="text-slate-600 font-light text-sm">Lebenslange Freischaltung inkl.</span>
                          </li>
                          <li className="flex items-start gap-3">
                            <CheckCircle2 className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" />
                            <span className="text-slate-600 font-light text-sm">Wetterfestes Material</span>
                          </li>
                        </>
                      )}
                    </ul>

                    <div className="border-t border-slate-100 pt-6 mt-auto flex items-center justify-between">
                      <div>
                        <div className="text-xs text-slate-400 font-light mb-0.5">Einmalig</div>
                        <div className="text-2xl font-heading font-bold text-slate-900 leading-none tracking-tight">
                          CHF {(product.price / 100).toFixed(2)}<span className="text-sm text-slate-400 font-medium"></span>
                        </div>
                      </div>
                      <Link href={`/medaillons`} className="btn btn-primary btn-small transition-transform hover:scale-105 shadow-md">
                        Bestellen
                      </Link>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* Closing CTA */}
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

      {/* Footer */}
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