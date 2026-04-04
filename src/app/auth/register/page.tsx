import Link from 'next/link';
import { signup } from '../actions';

export default function RegisterPage({ searchParams }: { searchParams: { error: string } }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-sage-100/40 blur-3xl -z-10" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-stone-200/50 blur-3xl -z-10" />

      <div className="max-w-md w-full glass p-10 rounded-3xl animate-slide-up">
        <div className="text-center mb-8">
          <Link href="/" className="font-serif text-2xl font-bold tracking-tight text-slate-900 inline-block mb-3 hover:opacity-80 transition">
            Nachklang <span className="text-sage-500 font-normal italic">CH</span>
          </Link>
          <h2 className="text-3xl font-serif text-slate-900 mt-2">Konto erstellen</h2>
          <p className="mt-3 text-slate-500 font-light">
            Der erste Schritt zu einem unvergesslichen Andenken. Völlig unverbindlich.
          </p>
        </div>
        
        {searchParams?.error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm mb-6 text-center border border-red-100 shadow-sm">
            Registrierung fehlgeschlagen. Versuche ein anderes Passwort oder existiert das Konto bereits?
          </div>
        )}

        <form className="space-y-5" action={signup}>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5 ml-1">Email-Adresse</label>
            <input name="email" type="email" required className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-sage-500 focus:ring-sage-500 sm:text-sm bg-white/70 py-3.5 px-4 outline-none border transition hover:bg-white" placeholder="deine@email.ch" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5 ml-1">Passwort</label>
            <input name="password" type="password" required minLength={6} className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-sage-500 focus:ring-sage-500 sm:text-sm bg-white/70 py-3.5 px-4 outline-none border transition hover:bg-white" placeholder="Mindestens 6 Zeichen" />
          </div>

          <button type="submit" className="w-full flex justify-center py-4 px-4 border border-transparent rounded-full shadow-md text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 transition mt-8 focus:ring-2 focus:ring-offset-2 focus:ring-slate-900">
            Kostenlos registrieren
          </button>
        </form>

        <div className="mt-8 text-center text-sm border-t border-slate-100 pt-6">
          <span className="text-slate-500 mr-2">Bereits ein Konto?</span>
          <Link href="/auth/login" className="text-sage-600 hover:text-sage-500 font-medium transition">
            Hier anmelden
          </Link>
        </div>
      </div>
    </div>
  );
}
