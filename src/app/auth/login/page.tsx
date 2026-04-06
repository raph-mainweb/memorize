'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState, KeyboardEvent, ClipboardEvent } from 'react'
import { sendOtpCode, verifyOtpCode, signInWithGoogle } from '../actions'
import Link from 'next/link'
import { Mail, ArrowRight, ShieldCheck, RotateCcw, Loader2 } from 'lucide-react'

// ─── OTP Input ───────────────────────────────────────────────────────────────

function OtpInput({
  value,
  onChange,
}: {
  value: string[]
  onChange: (v: string[]) => void
}) {
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  const focus = (i: number) => inputs.current[i]?.focus()

  const handleChange = (i: number, raw: string) => {
    const digit = raw.replace(/\D/g, '').slice(-1)
    const next = [...value]
    next[i] = digit
    onChange(next)
    if (digit && i < 5) focus(i + 1)
  }

  const handleKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (value[i]) {
        const next = [...value]
        next[i] = ''
        onChange(next)
      } else if (i > 0) {
        focus(i - 1)
        const next = [...value]
        next[i - 1] = ''
        onChange(next)
      }
    } else if (e.key === 'ArrowLeft' && i > 0) {
      focus(i - 1)
    } else if (e.key === 'ArrowRight' && i < 5) {
      focus(i + 1)
    }
  }

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return
    const next = Array(6).fill('')
    pasted.split('').forEach((ch, idx) => { next[idx] = ch })
    onChange(next)
    // Focus last filled or next empty
    const lastIdx = Math.min(pasted.length, 5)
    focus(lastIdx)
  }

  return (
    <div className="flex gap-3 justify-center">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { inputs.current[i] = el }}
          type="text"
          inputMode="numeric"
          pattern="\d*"
          maxLength={1}
          value={value[i]}
          autoFocus={i === 0}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          className="
            w-12 h-14 text-center text-2xl font-bold
            bg-stone-50 border-2 rounded-2xl
            text-slate-900 caret-transparent
            border-slate-200 focus:border-slate-900 focus:bg-white
            transition-all duration-150 outline-none
            shadow-sm focus:shadow-md
            sm:w-14 sm:h-16
          "
          aria-label={`Code Ziffer ${i + 1}`}
        />
      ))}
    </div>
  )
}

// ─── Google Button ─────────────────────────────────────────────────────────

function GoogleButton({ pending }: { pending: boolean }) {
  return (
    <form
      action={async () => {
        await signInWithGoogle()
      }}
      className="mt-6"
    >
      <button
        type="submit"
        disabled={pending}
        className="w-full flex justify-center items-center gap-3 py-4 px-4 border border-slate-200 rounded-2xl shadow-sm text-sm font-bold text-slate-700 bg-white hover:bg-stone-50 transition disabled:opacity-50"
      >
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
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────

type Step = 'email' | 'otp'

export default function LoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''))
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resendCooldown, setResendCooldown] = useState(0)

  // ── Step 1: Send OTP ──────────────────────────────────────────────────────

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setError(null)
    setPending(true)

    const result = await sendOtpCode(email.trim())

    setPending(false)
    if (result.error) {
      setError('Fehler beim Senden. Bitte versuche es noch einmal.')
      return
    }

    setStep('otp')
    startResendCooldown()
  }

  // ── Resend cooldown (60 s) ─────────────────────────────────────────────────

  const startResendCooldown = () => {
    setResendCooldown(60)
    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) { clearInterval(timer); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  const handleResend = async () => {
    if (resendCooldown > 0) return
    setError(null)
    setPending(true)
    const result = await sendOtpCode(email.trim())
    setPending(false)
    if (result.error) {
      setError('Fehler beim erneuten Senden.')
      return
    }
    setOtp(Array(6).fill(''))
    startResendCooldown()
  }

  // ── Step 2: Verify OTP ────────────────────────────────────────────────────

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = otp.join('')
    if (token.length < 6) {
      setError('Bitte alle 6 Stellen eingeben.')
      return
    }
    setError(null)
    setPending(true)

    const result = await verifyOtpCode(email.trim(), token)

    setPending(false)
    if (result.error) {
      setError('Ungültiger oder abgelaufener Code. Bitte versuche es noch einmal.')
      setOtp(Array(6).fill(''))
      return
    }

    router.push(result.isAdmin ? '/admin' : '/dashboard')
    router.refresh()
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/80 backdrop-blur-xl p-8 sm:p-10 rounded-[2rem] shadow-xl shadow-stone-200/50 border border-white">

        {/* Header */}
        <div className="text-center mb-10">
          <Link href="/" className="font-serif text-3xl font-bold tracking-tight text-slate-900 inline-block mb-2">
            Nachklang
          </Link>
          <p className="text-slate-500 font-medium tracking-wide">Privater Zugang</p>
        </div>

        {/* ── STEP 1: E-Mail ── */}
        {step === 'email' && (
          <>
            <form onSubmit={handleSendOtp} noValidate>
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2 ml-1">
                  E-Mail-Adresse
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="deine@email.ch"
                  className="w-full px-5 py-4 bg-stone-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-slate-400 focus:border-slate-400 focus:bg-white transition text-slate-900 font-medium outline-none"
                />
              </div>

              {error && (
                <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-center">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={pending || !email.trim()}
                className="w-full flex justify-center items-center gap-2 py-4 px-4 rounded-2xl shadow-md text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 transition mt-6 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {pending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Mail className="w-4 h-4 text-slate-300" />
                    Code senden
                    <ArrowRight className="w-4 h-4 ml-1 opacity-70" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative mt-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white/80 text-slate-400 text-[10px] uppercase tracking-widest font-bold border border-slate-100 rounded-full">
                  Oder
                </span>
              </div>
            </div>

            <GoogleButton pending={pending} />
          </>
        )}

        {/* ── STEP 2: OTP Code ── */}
        {step === 'otp' && (
          <>
            {/* Info */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-slate-100 rounded-2xl mb-4">
                <ShieldCheck className="w-7 h-7 text-slate-700" />
              </div>
              <h2 className="text-lg font-serif font-bold text-slate-900 mb-1">
                Code eingeben
              </h2>
              <p className="text-sm text-slate-500 leading-relaxed">
                Wir haben einen 6-stelligen Code an{' '}
                <span className="font-semibold text-slate-700">{email}</span>{' '}
                gesendet. Der Code ist 10 Minuten gültig.
              </p>
            </div>

            <form onSubmit={handleVerify} noValidate>
              <OtpInput value={otp} onChange={setOtp} />

              {error && (
                <p className="mt-5 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-center">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={pending || otp.join('').length < 6}
                className="w-full flex justify-center items-center gap-2 py-4 px-4 rounded-2xl shadow-md text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 transition mt-6 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {pending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-slate-300" />
                    Anmelden
                    <ArrowRight className="w-4 h-4 ml-1 opacity-70" />
                  </>
                )}
              </button>
            </form>

            {/* Resend + back */}
            <div className="mt-6 flex flex-col items-center gap-3">
              <button
                onClick={handleResend}
                disabled={resendCooldown > 0 || pending}
                className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                {resendCooldown > 0
                  ? `Erneut senden in ${resendCooldown}s`
                  : 'Code erneut senden'}
              </button>

              <button
                onClick={() => { setStep('email'); setOtp(Array(6).fill('')); setError(null) }}
                className="text-xs text-slate-400 hover:text-slate-600 transition"
              >
                Andere E-Mail verwenden
              </button>
            </div>
          </>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-[11px] text-slate-400">
          Mit der Anmeldung stimmst du unseren AGB zu.
        </div>
      </div>
    </div>
  )
}
