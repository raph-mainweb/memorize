'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { X, Mail, Loader2, ArrowRight, ShieldCheck, RotateCcw } from 'lucide-react';

import type { MemorialState } from './GuestBuilderClient';

const STORAGE_KEY = 'nachklang_guest_draft';

interface AuthModalProps {
  onSuccess: () => void;
  onClose: () => void;
  guestData?: MemorialState; // Wird vor Google OAuth in sessionStorage gesichert
}

const OTP_LENGTH = 6;

// ── Inline OTP Input (gleicher Stil wie Login) ────────────────────────────────
function OtpInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const focus = (i: number) => inputs.current[i]?.focus();

  const handleChange = (i: number, raw: string) => {
    const digit = raw.replace(/\D/g, '').slice(-1);
    const next = [...value]; next[i] = digit; onChange(next);
    if (digit && i < OTP_LENGTH - 1) focus(i + 1);
  };
  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (value[i]) { const n = [...value]; n[i] = ''; onChange(n); }
      else if (i > 0) { focus(i - 1); const n = [...value]; n[i - 1] = ''; onChange(n); }
    } else if (e.key === 'ArrowLeft' && i > 0) focus(i - 1);
    else if (e.key === 'ArrowRight' && i < OTP_LENGTH - 1) focus(i + 1);
  };
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = Array(OTP_LENGTH).fill('');
    pasted.split('').forEach((ch, idx) => { next[idx] = ch; });
    onChange(next);
    focus(Math.min(pasted.length, OTP_LENGTH - 1));
  };

  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length: OTP_LENGTH }).map((_, i) => (
        <input key={i} ref={(el) => { inputs.current[i] = el; }}
          type="text" inputMode="numeric" pattern="\d*" maxLength={1}
          value={value[i]} autoFocus={i === 0}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          className="w-11 h-14 text-center text-xl font-bold bg-stone-50 border-2 rounded-xl text-slate-900 caret-transparent border-slate-200 focus:border-slate-900 focus:bg-white transition-all outline-none shadow-sm focus:shadow-md"
          aria-label={`Code Ziffer ${i + 1}`}
        />
      ))}
    </div>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────────────
export default function AuthModal({ onSuccess, onClose, guestData }: AuthModalProps) {
  const supabase = createClient();
  const [step, setStep]       = useState<'email' | 'code'>('email');
  const [email, setEmail]     = useState('');
  const [otp, setOtp]         = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [cooldown, setCooldown] = useState(0);

  // Nach erfolgreicher Verifizierung im selben Tab feuert SIGNED_IN → onSuccess
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
        onSuccess();
      }
    });
    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startCooldown = () => {
    setCooldown(60);
    const t = setInterval(() => setCooldown(p => { if (p <= 1) { clearInterval(t); return 0; } return p - 1; }), 1000);
  };

  // ── Schritt 1: OTP senden ─────────────────────────────────────────────────
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true); setError('');

    // Kein emailRedirectTo → Supabase sendet 6-stelligen Code (kein Magic Link)
    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true },
    });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setStep('code');
    startCooldown();
  };

  // ── Schritt 2: Code verifizieren ──────────────────────────────────────────
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = otp.join('');
    if (token.length < OTP_LENGTH) { setError('Bitte alle 6 Stellen eingeben.'); return; }
    setLoading(true); setError('');

    const { error: err } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token,
      type: 'email',
    });
    setLoading(false);
    if (err) {
      setError('Ungültiger oder abgelaufener Code. Bitte versuche es noch einmal.');
      setOtp(Array(OTP_LENGTH).fill(''));
    }
    // Bei Erfolg feuert onAuthStateChange → onSuccess() → persistToDb()
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setLoading(true); setError('');
    await supabase.auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: true } });
    setLoading(false);
    setOtp(Array(OTP_LENGTH).fill(''));
    startCooldown();
  };

  // ── Google OAuth — State vor Redirect in sessionStorage sichern ─────────
  const handleGoogle = async () => {
    if (guestData) {
      // Text-State sichern (Bilder/Object-URLs können nicht serialisiert werden)
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(guestData));
    }
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/gedenken/neu` },
    });
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden">

        {/* Gradient top bar */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sage-300 via-sage-500 to-stone-300" />

        <button onClick={onClose}
          className="absolute top-5 right-5 w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-stone-200 transition">
          <X className="w-4 h-4" />
        </button>

        <div className="p-8 sm:p-10">

          {/* ── Schritt 1: E-Mail ── */}
          {step === 'email' && (
            <>
              <div className="text-center mb-8">
                <div className="w-14 h-14 rounded-2xl bg-sage-50 border border-sage-100 flex items-center justify-center mx-auto mb-5">
                  <Mail className="w-7 h-7 text-sage-600" />
                </div>
                <h2 className="text-2xl font-serif text-slate-900 mb-2">Gedenkseite speichern</h2>
                <p className="text-slate-500 font-light text-sm leading-relaxed max-w-xs mx-auto">
                  Wir senden dir einen 6-stelligen Code per E-Mail.
                  Bestehende Konten werden automatisch erkannt.
                </p>
              </div>

              <form onSubmit={handleSendCode} className="space-y-4">
                {error && <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">{error}</div>}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 ml-1">E-Mail-Adresse</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="deine@email.ch" required autoFocus
                    className="w-full px-4 py-3.5 bg-stone-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-sage-400 focus:border-sage-400 focus:bg-white transition text-slate-900 text-sm outline-none" />
                </div>
                <button type="submit" disabled={loading || !email.trim()}
                  className="w-full py-3.5 px-6 rounded-2xl bg-slate-900 font-semibold text-white text-sm hover:bg-slate-800 transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Code senden <ArrowRight className="w-4 h-4 opacity-70" /></>}
                </button>
              </form>

              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-stone-100" />
                <span className="text-xs text-slate-400 font-medium">oder</span>
                <div className="flex-1 h-px bg-stone-100" />
              </div>

              <button onClick={handleGoogle}
                className="w-full py-3.5 px-6 rounded-2xl border border-slate-200 bg-white font-medium text-slate-700 text-sm hover:bg-stone-50 hover:border-slate-300 transition flex items-center justify-center gap-3 shadow-sm">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Weiter mit Google
              </button>
              <p className="text-center text-[11px] text-slate-400 mt-4 leading-relaxed">
                Kein Konto nötig — bestehende Kunden werden automatisch eingeloggt.
              </p>
            </>
          )}

          {/* ── Schritt 2: Code eingeben ── */}
          {step === 'code' && (
            <>
              <div className="text-center mb-8">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-5">
                  <ShieldCheck className="w-7 h-7 text-slate-700" />
                </div>
                <h2 className="text-2xl font-serif text-slate-900 mb-2">Code eingeben</h2>
                <p className="text-slate-500 font-light text-sm leading-relaxed max-w-xs mx-auto">
                  Wir haben einen 6-stelligen Code an{' '}
                  <strong className="text-slate-700 font-medium">{email}</strong> gesendet.
                </p>
              </div>

              <form onSubmit={handleVerifyCode} className="space-y-5">
                <OtpInput value={otp} onChange={setOtp} />
                {error && <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 text-center">{error}</div>}
                <button type="submit" disabled={loading || otp.join('').length < OTP_LENGTH}
                  className="w-full py-3.5 px-6 rounded-2xl bg-slate-900 font-semibold text-white text-sm hover:bg-slate-800 transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ShieldCheck className="w-4 h-4 opacity-70" /> Anmelden & speichern</>}
                </button>
              </form>

              <div className="mt-5 flex flex-col items-center gap-3">
                <button onClick={handleResend} disabled={cooldown > 0 || loading}
                  className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition disabled:opacity-40">
                  <RotateCcw className="w-3.5 h-3.5" />
                  {cooldown > 0 ? `Erneut senden in ${cooldown}s` : 'Code erneut senden'}
                </button>
                <button onClick={() => { setStep('email'); setOtp(Array(OTP_LENGTH).fill('')); setError(''); }}
                  className="text-xs text-slate-400 hover:text-slate-600 transition">
                  Andere E-Mail verwenden
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
