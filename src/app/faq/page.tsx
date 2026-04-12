import Link from 'next/link';
import { ArrowLeft, HelpCircle } from 'lucide-react';

export default function FAQPage() {
  const faqs = [
    {
      question: 'Wie funktioniert eine digitale Gedenkseite?',
      answer: 'Nach der kostenlosen Gestaltung deiner Gedenkseite erhältst du eine Online-Vorschau. Aktivierst du diese Seite, bleibt sie für immer online. Das dazugehörige QR-Medaillon wird direkt zu dir nach Hause geschickt.'
    },
    {
      question: 'Welche Kosten fallen an?',
      answer: 'Die Erstellung der Gedenkseite ist komplett kostenlos. Möchtest du sie dauerhaft freischalten und das QR-Medaillon erhalten, fällt eine einmalige Gebühr von 49 CHF an. Es gibt keine versteckten Kosten und keine monatlichen Abonnements.'
    },
    {
      question: 'Wie befestige ich das QR-Medaillon?',
      answer: 'Das Medaillon ist wetterfest und wird mit einem ultrastarken, witterungsbeständigen Klebepad auf der Rückseite geliefert. Du kannst es direkt auf Grabsteine, Urnen oder Gedenktafeln kleben. Der Untergrund sollte vorher sauber und trocken sein.'
    },
    {
      question: 'Brauchen Besucher eine spezielle App zum Scannen?',
      answer: 'Nein, überhaupt nicht. Jedes moderne Smartphone kann den QR-Code direkt mit der Standard-Kamera-App scannen. Die Gedenkseite öffnet sich sofort im normalen Internet-Browser.'
    }
  ];

  return (
    <div className="min-h-screen bg-stone-50 pt-32 pb-24">
      <div className="max-w-3xl mx-auto px-6 lg:px-8">
        
        <div className="mb-12">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-brand-500 transition mb-6">
            <ArrowLeft className="w-4 h-4" />
            Zurück zur Startseite
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-brand-100 text-brand-600 rounded-xl flex items-center justify-center">
              <HelpCircle className="w-5 h-5" />
            </div>
            <h1 className="text-4xl font-heading font-medium text-slate-900">Häufig gestellte Fragen</h1>
          </div>
          <p className="text-lg text-slate-500 font-light">Alles, was du über Nachklang und unsere QR-Medaillons wissen musst.</p>
        </div>

        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h3 className="text-lg font-heading font-semibold text-brand-navy mb-3">{faq.question}</h3>
              <p className="text-slate-600 font-light leading-relaxed">{faq.answer}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 bg-brand-50 rounded-3xl p-8 text-center border border-brand-100">
          <h2 className="text-2xl font-heading text-brand-navy mb-2">Noch offene Fragen?</h2>
          <p className="text-slate-600 font-light mb-6">Unser Support-Team hilft dir gerne persönlich weiter.</p>
          <a href="mailto:hallo@nachklang.ch" className="btn btn-primary inline-flex">
            Kontakt aufnehmen
          </a>
        </div>
      </div>
    </div>
  );
}
