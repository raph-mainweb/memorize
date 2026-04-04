import Link from 'next/link';
import { Mail, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function LoginPage({ searchParams }: { searchParams: { error?: string, success?: string } }) {
  const isSuccess = searchParams.success === 'true';

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4 selection:bg-sage-200">
      <div className="w-full max-w-md bg-white/80 backdrop-blur-xl p-8 sm:p-10 rounded-[2rem] shadow-xl shadow-stone-200/50 border border-white">
        
        <div className="text-center mb-10">
          <Link href="/" className="font-serif text-3xl font-bold tracking-tight text-slate-900 inline-block mb-2">Nachklang</Link>
          <p className="text-slate-500 font-medium tracking-wide">Privater Zugang</p>
        </div>

        {isSuccess ? (
             <div className="text-center bg-sage-50 rounded-2xl p-8 border border-sage-100 mb-8 mt-4">
                <CheckCircle2 className="w-12 h-12 text-sage-600 mx-auto mb-5" />
                <h3 className="text-xl font-serif text-slate-900 mb-3">Prüfe deinen Posteingang!</h3>
                <p className="text-slate-600 text-sm leading-relaxed">Wir haben dir soeben einen sicheren, passwortlosen Session-Link geschickt. Klicke einfach darauf, um sicher ins Dashboard zu gelangen.</p>
             </div>
        ) : (
             <>
                {searchParams.error && (
                  <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 text-center">
                    Oops! Da ist etwas schiefgelaufen. Bitte versuche es noch einmal.
                  </div>
                )}
                
                <form action={async (formData) => { "use server"; const { sendMagicLink } = await import('../actions'); await sendMagicLink(formData); }}>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2 ml-1">E-Mail-Adresse</label>
                    <input name="email" type="email" required className="w-full px-5 py-4 bg-stone-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-sage-400 focus:border-sage-400 focus:bg-white transition text-slate-900 font-medium" placeholder="deine@email.ch" />
                  </div>
                  
                  <button type="submit" className="w-full flex justify-center items-center gap-2 py-4 px-4 border border-transparent rounded-2xl shadow-md text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 transition mt-6 focus:ring-2 focus:ring-offset-2 focus:ring-slate-900">
                    <Mail className="w-4 h-4 text-slate-300" /> Link senden <ArrowRight className="w-4 h-4 ml-1 opacity-70" />
                  </button>
                </form>

                <div className="relative mt-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white/80 text-slate-400 text-[10px] uppercase tracking-widest font-bold border border-slate-100 rounded-full">Oder</span>
                  </div>
                </div>

                <form action={async () => { "use server"; const { signInWithGoogle } = await import('../actions'); await signInWithGoogle(); }} className="mt-8">
                  <button type="submit" className="w-full flex justify-center items-center gap-3 py-4 px-4 border border-slate-200 rounded-2xl shadow-sm text-sm font-bold text-slate-700 bg-white hover:bg-stone-50 transition">
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
             </>
         )}

         <div className="mt-8 text-center text-[11px] text-slate-400">
           Mit der Anmeldung stimmst du unseren AGB zu.
         </div>
      </div>
    </div>
  );
}
