'use client';

/**
 * /m/activate — Aktivierungstoken-Eingabe (Flow D Fall 2 / Flow B2 Gift)
 *
 * Shown when a QR code scan reveals a free medallion with no owner yet,
 * and the visitor doesn't have a QR credit in their account.
 *
 * Flow:
 * 1. User enters their activation token (UUID from gift confirmation email)
 * 2. Token is validated via API
 * 3. If valid: user is prompted to login/register, then linked to the medallion
 */

import { useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function ActivatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get('code') || '';

  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/activation/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim(), code }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Ungültiger oder abgelaufener Aktivierungscode.');
        return;
      }

      // Token valid — redirect to auth with token in URL for post-login activation
      router.push(`/auth/login?redirect=/dashboard/neue&activation_token=${token.trim()}&medallion_code=${code}`);
    } catch {
      setError('Ein Fehler ist aufgetreten. Bitte versuche es erneut.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center px-6">
      <div className="max-w-sm w-full text-center">

        {/* Icon */}
        <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
          </svg>
        </div>

        <h1 className="font-serif text-3xl text-slate-900 mb-2">Medaillon aktivieren</h1>
        {code && (
          <p className="text-sm font-mono text-slate-400 mb-4">Code: {code}</p>
        )}
        <p className="text-slate-500 font-light leading-relaxed mb-8">
          Gib deinen Aktivierungscode ein, den du per E-Mail erhalten hast. Er ist 90 Tage gültig.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Aktivierungscode eingeben"
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 bg-white"
            required
            autoComplete="off"
            spellCheck={false}
          />

          {error && (
            <p className="text-sm text-red-500 text-left">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !token.trim()}
            className="w-full bg-slate-900 text-white py-3 rounded-full text-sm font-medium hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Wird geprüft…' : 'Aktivieren →'}
          </button>
        </form>

        <p className="mt-6 text-xs text-slate-400">
          Hast du kein Medaillon erhalten?{' '}
          <a href="/" className="underline hover:text-slate-600">Zur Startseite</a>
        </p>
      </div>
    </div>
  );
}
