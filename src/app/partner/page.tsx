import Link from 'next/link';
import { ArrowLeft, Handshake, Users, HeartHandshake } from 'lucide-react';

export default function PartnerPage() {
  const benefits = [
    {
      icon: <Users className="w-6 h-6 text-brand-primary" />,
      title: 'Für Bestatter',
      desc: 'Bieten Sie Ihren Kunden einen echten Mehrwert für die Zeit nach der Beisetzung. Nachklang QR-Medaillons sind eine moderne Ergänzung Ihres Portfolios.'
    },
    {
      icon: <HeartHandshake className="w-6 h-6 text-brand-primary" />,
      title: 'Für Steinmetze',
      desc: 'Hochwertige QR-Medaillons aus stilvollem Material, die wetterfest sind und sich optisch nahtlos in moderne sowie traditionelle Grabsteine integrieren lassen.'
    },
    {
      icon: <Handshake className="w-6 h-6 text-brand-primary" />,
      title: 'Attraktive Konditionen',
      desc: 'Wir bieten exklusive B2B-Konditionen für unsere Partner. Bestellen Sie Medaillons auf Vorrat und übergeben Sie diese zusammen mit einem Aktivierungscode an die Hinterbliebenen.'
    }
  ];

  return (
    <div className="min-h-screen bg-stone-50 pt-32 pb-24">
      <div className="max-w-4xl mx-auto px-6 lg:px-8">
        
        <div className="text-center mb-16">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-brand-500 transition mb-6">
            <ArrowLeft className="w-4 h-4" />
            Zurück zur Startseite
          </Link>
          <h1 className="text-4xl md:text-5xl font-heading font-medium text-brand-navy mb-4">Partner werden</h1>
          <p className="text-xl text-slate-500 font-light max-w-2xl mx-auto">
            Gemeinsam die Erinnerungskultur modernisieren. Werden Sie offizieller Nachklang-Partner in der Schweiz.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {benefits.map((benefit, i) => (
            <div key={i} className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm text-center">
              <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center mx-auto mb-6">
                {benefit.icon}
              </div>
              <h3 className="text-lg font-heading font-semibold text-brand-navy mb-3">{benefit.title}</h3>
              <p className="text-sm text-slate-500 font-light leading-relaxed">{benefit.desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-brand-navy rounded-3xl p-8 md:p-12 text-white overflow-hidden relative">
          <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-brand-500/20 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 max-w-2xl">
            <h2 className="text-3xl font-heading font-medium mb-4">Interesse an einer Zusammenarbeit?</h2>
            <p className="text-white/80 font-light mb-8 text-lg">
              Kontaktieren Sie uns unverbindlich. Gerne senden wir Ihnen unser Partner-Dossier inklusive Muster-Medaillon zu und besprechen die Möglichkeiten einer Kooperation.
            </p>
            
            <form className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="Vorname" className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-brand-300" />
                <input type="text" placeholder="Nachname" className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-brand-300" />
              </div>
              <input type="text" placeholder="Firma / Unternehmen" className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-brand-300" />
              <input type="email" placeholder="E-Mail Adresse" className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-brand-300" />
              
              <button type="button" className="bg-brand-primary hover:brightness-110 text-white font-medium px-8 py-3.5 rounded-full transition w-full md:w-auto mt-4 shadow-lg">
                Anfrage senden
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
