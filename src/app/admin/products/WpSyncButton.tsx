'use client';

import { useState } from 'react';
import { RefreshCw, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface SyncResult {
  ok: boolean;
  durationMs?: number;
  summary?: {
    totalShopify: number;
    created: number;
    updated: number;
    errors: number;
  };
  error?: string;
}

export default function WpSyncButton() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<SyncResult | null>(null);

  async function handleSync() {
    setStatus('loading');
    setResult(null);
    try {
      const res = await fetch('/api/wordpress/sync-products', { method: 'POST' });
      const data: SyncResult = await res.json();
      setResult(data);
      setStatus(data.ok ? 'success' : 'error');
    } catch {
      setResult({ ok: false, error: 'Netzwerkfehler' });
      setStatus('error');
    }
    // Auto-reset nach 8 Sekunden
    setTimeout(() => { setStatus('idle'); setResult(null); }, 8000);
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={handleSync}
        disabled={status === 'loading'}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition border
          disabled:opacity-60 disabled:cursor-not-allowed
          bg-violet-50 border-violet-200 text-violet-700 hover:bg-violet-100"
      >
        {status === 'loading' ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <RefreshCw className="w-4 h-4" />
        )}
        {status === 'loading' ? 'Syncing…' : 'Zu WordPress syncen'}
      </button>

      {/* Result Feedback */}
      {result && status === 'success' && (
        <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
          <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>
            {result.summary?.created} erstellt · {result.summary?.updated} aktualisiert
            {result.durationMs ? ` · ${(result.durationMs / 1000).toFixed(1)}s` : ''}
          </span>
        </div>
      )}
      {result && status === 'error' && (
        <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg">
          <XCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{result.error || 'Sync fehlgeschlagen'}</span>
        </div>
      )}
    </div>
  );
}
