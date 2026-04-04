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

        <div className="relative mt-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-stone-50 text-slate-500 text-xs uppercase tracking-widest font-medium">Oder</span>
          </div>
        </div>

        <form action={async () => { "use server"; const { signInWithGoogle } = await import('../actions'); await signInWithGoogle(); }} className="mt-8">
          <button type="submit" className="w-full flex justify-center items-center gap-3 py-3.5 px-4 border border-slate-200 rounded-full shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-stone-50 transition">
            <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              <path d="M1 1h22v22H1z" fill="none"/>
            </svg>
            Mit Google fortfahren
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
