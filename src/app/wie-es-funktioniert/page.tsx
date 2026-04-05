export const metadata = {
  title: 'Wie es funktioniert | Nachklang CH',
  description: 'So einfach erstellen Sie eine wunderschöne Gedenkseite für Ihre Liebsten.',
};

import { BookOpen, Heart, Clock } from 'lucide-react';

export default function HowItWorksPage() {
  return (
    <div className="flex-grow flex flex-col items-center bg-stone-50 py-24">
      <div className="max-w-4xl w-full px-6 text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-serif text-slate-900 mb-6 tracking-tight">Der Weg zur Gedenkseite</h1>
        <p className="text-slate-500 text-lg md:text-xl font-light leading-relaxed max-w-2xl mx-auto">
          Ein transparenter, müheloser Prozess, um einen unvergesslichen Ort der Erinnerung zu schaffen.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 md:gap-12 relative max-w-6xl px-6 w-full">
        {/* Step 1 */}
        <div className="flex flex-col items-center text-center p-8 bg-white/70 backdrop-blur-md rounded-3xl shadow-sm border border-white">
          <div className="w-20 h-20 bg-stone-50 rounded-2xl flex items-center justify-center mb-8 shadow-sm">
            <BookOpen className="w-8 h-8 text-sage-600" />
          </div>
          <h3 className="text-2xl font-serif text-slate-900 mb-4">1. Seite gestalten</h3>
          <p className="text-slate-500 leading-relaxed font-light">
            Erstelle eine wunderschöne Vorschau. Lade Fotos hoch und verfasse eine würdevolle Biografie.
          </p>
        </div>

        {/* Step 2 */}
        <div className="flex flex-col items-center text-center p-8 bg-white/70 backdrop-blur-md rounded-3xl shadow-sm border border-white">
          <div className="w-20 h-20 bg-stone-50 rounded-2xl flex items-center justify-center mb-8 shadow-sm">
            <Heart className="w-8 h-8 text-sage-600" />
          </div>
          <h3 className="text-2xl font-serif text-slate-900 mb-4">2. Freischalten</h3>
          <p className="text-slate-500 leading-relaxed font-light">
            Aktiviere die Seite. Keine Abos und keine versteckten Kosten. Die Erinnerung bleibt dauerhaft.
          </p>
        </div>

        {/* Step 3 */}
        <div className="flex flex-col items-center text-center p-8 bg-white/70 backdrop-blur-md rounded-3xl shadow-sm border border-white">
          <div className="w-20 h-20 bg-stone-50 rounded-2xl flex items-center justify-center mb-8 shadow-sm">
            <Clock className="w-8 h-8 text-sage-600" />
          </div>
          <h3 className="text-2xl font-serif text-slate-900 mb-4">3. QR-Medaillon</h3>
          <p className="text-slate-500 leading-relaxed font-light">
            Das fest verknüpfte QR-Medaillon wird direkt nach der Freischaltung per Post versandt.
          </p>
        </div>
      </div>
    </div>
  );
}
