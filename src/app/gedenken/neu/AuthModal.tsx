'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { X, Mail, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';

interface AuthModalProps {
  onSuccess: () => void;
  onClose: () => void;
}

export default function AuthModal({ onSuccess, onClose }: AuthModalProps) {
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'email' | 'sent'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Warte auf eingehende Auth-Session (Magic Link Klick oder OAuth-Redirect)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
        onSuccess();
      }
    });
    return () => subscription.unsubscribe();
  }, [supabase, onSuccess]);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');

    // Supabase Magic Link — funktioniert automatisch für neue UND bestehende Accounts
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        // Redirect zurück zur gleichen Seite — der onAuthStateChange-Listener greift dann
        emailRedirectTo: `${window.location.origin}/gedenken/neu`,
      },
    });

    setLoading(false);
    if (otpError) {
      setError(otpError.message);
    } else {
      setStep('sent');
    }
  };

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/gedenken/neu`,
      },
    });
  };

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl shadow-stone-400/20 overflow-hidden">
        
        {/* Dekorativer Gradient */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sage-300 via-sage-500 to-stone-300" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-stone-200 transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-8 sm:p-10">

          {step === 'email' ? (
            <>
              {/* Header */}
              <div className="text-center mb-8">
                <div className="w-14 h-14 rounded-2xl bg-sage-50 border border-sage-100 flex items-center justify-center mx-auto mb-5">
                  <Mail className="w-7 h-7 text-sage-600" />
                </div>
                <h2 className="text-2xl font-serif text-slate-900 mb-2">Gedenkseite speichern</h2>
                <p className="text-slate-500 font-light text-sm leading-relaxed max-w-xs mx-auto">
                  Wir senden dir einen Link per E-Mail — damit ist deine Seite dauerhaft gesichert. 
                  Falls du bereits ein Konto hast, wirst du automatisch eingeloggt.
                </p>
              </div>

              {/* Email Form */}
              <form onSubmit={handleMagicLink} className="space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
                    {error}
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 ml-1">
                    E-Mail-Adresse
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="deine@email.ch"
                    required
                    autoFocus
                    className="w-full px-4 py-3.5 bg-stone-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-sage-400 focus:border-sage-400 focus:bg-white transition text-slate-900 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="w-full py-3.5 px-6 rounded-2xl bg-slate-900 font-semibold text-white text-sm hover:bg-slate-800 transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Weiter mit E-Mail
                      <ArrowRight className="w-4 h-4 opacity-70" />
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-stone-100" />
                <span className="text-xs text-slate-400 font-medium">oder</span>
                <div className="flex-1 h-px bg-stone-100" />
              </div>

              {/* Google OAuth */}
              <button
                onClick={handleGoogle}
                className="w-full py-3.5 px-6 rounded-2xl border border-slate-200 bg-white font-medium text-slate-700 text-sm hover:bg-stone-50 hover:border-slate-300 transition flex items-center justify-center gap-3 shadow-sm"
              >
                {/* Google Icon SVG */}
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Weiter mit Google
              </button>

              <p className="text-center text-[11px] text-slate-400 mt-5 leading-relaxed">
                Kein Konto nötig — ein Klick auf den Link in der E-Mail genügt.
                <br />Bestehende Kunden werden automatisch eingeloggt.
              </p>
            </>
          ) : (
            /* Sent State */
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-2xl bg-green-50 border border-green-100 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-serif text-slate-900 mb-3">Link gesendet!</h2>
              <p className="text-slate-500 font-light text-sm leading-relaxed mb-6 max-w-xs mx-auto">
                Wir haben einen Anmeldelink an <strong className="text-slate-700 font-medium">{email}</strong> geschickt.
                Bitte prüfe auch deinen Spam-Ordner.
              </p>
              <p className="text-xs text-slate-400">
                Dieses Fenster bleibt offen — nach dem Klick auf den Link speichern wir deine Gedenkseite automatisch.
              </p>
              <button
                onClick={() => setStep('email')}
                className="mt-6 text-sm text-sage-600 hover:text-sage-700 underline underline-offset-4"
              >
                Andere E-Mail verwenden
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
