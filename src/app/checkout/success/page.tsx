import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-8 h-8 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-serif text-slate-900 mb-2">Bestellung erhalten!</h1>
        <p className="text-slate-500 text-sm mb-8 leading-relaxed">
          Vielen Dank für deine Bestellung. Du erhältst eine Bestätigungs-E-Mail.
          Das Medaillon wird nach Zahlungseingang versendet.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-slate-800 transition"
        >
          Zum Dashboard
        </Link>
      </div>
    </div>
  );
}
