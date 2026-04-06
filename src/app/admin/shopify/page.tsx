/**
 * Admin: Shopify Connection Status
 * /admin/shopify
 *
 * Shows whether the Shopify OAuth connection is active.
 * Provides the install link (protected by SHOPIFY_INSTALL_SECRET).
 * Admin-only — never exposed to customers.
 */

import { createAdminClient } from '@/utils/supabase/admin';
import Link from 'next/link';
import { CheckCircle2, XCircle, ExternalLink, RefreshCw, ArrowLeft, ShieldCheck } from 'lucide-react';

const SHOPIFY_DOMAIN = process.env.SHOPIFY_SHOP_DOMAIN || '';
const INSTALL_SECRET = process.env.SHOPIFY_INSTALL_SECRET || '';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || '';

export const dynamic = 'force-dynamic';

async function getConnectionStatus() {
  try {
    const db = createAdminClient();
    const { data } = await db
      .from('shopify_config')
      .select('shop_domain, scope, installed_at, updated_at')
      .eq('shop_domain', SHOPIFY_DOMAIN)
      .single();
    return data || null;
  } catch {
    return null;
  }
}

export default async function ShopifyAdminPage({
  searchParams,
}: {
  searchParams: { connected?: string };
}) {
  const config = await getConnectionStatus();
  const isConnected = !!config;
  const justConnected = searchParams.connected === 'true';

  const installUrl = INSTALL_SECRET
    ? `${APP_URL}/api/shopify/install?secret=${INSTALL_SECRET}`
    : null;

  return (
    <div className="p-8 md:p-12 max-w-3xl">
      <header className="mb-10">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Zurück zum Admin
        </Link>
        <h1 className="text-4xl font-serif text-slate-900">Shopify Verbindung</h1>
        <p className="text-slate-500 mt-2">OAuth-Status und Token-Verwaltung für den Shopify Product Service.</p>
      </header>

      {/* Success banner */}
      {justConnected && (
        <div className="mb-6 p-4 bg-sage-50 border border-sage-200 rounded-2xl flex items-center gap-3 text-sage-800">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium">Shopify erfolgreich verbunden! Produkte werden jetzt geladen.</span>
        </div>
      )}

      {/* Connection status card */}
      <div className={`rounded-3xl border p-8 mb-6 ${isConnected ? 'border-sage-200 bg-sage-50' : 'border-red-200 bg-red-50'}`}>
        <div className="flex items-center gap-4 mb-6">
          {isConnected ? (
            <CheckCircle2 className="w-8 h-8 text-sage-600 flex-shrink-0" />
          ) : (
            <XCircle className="w-8 h-8 text-red-500 flex-shrink-0" />
          )}
          <div>
            <h2 className={`text-xl font-semibold ${isConnected ? 'text-sage-900' : 'text-red-800'}`}>
              {isConnected ? 'Verbunden' : 'Nicht verbunden'}
            </h2>
            <p className={`text-sm mt-0.5 ${isConnected ? 'text-sage-700' : 'text-red-700'}`}>
              {isConnected
                ? `Token für ${config.shop_domain} aktiv`
                : 'Kein gültiger Access Token vorhanden. OAuth-Flow ausführen.'}
            </p>
          </div>
        </div>

        {isConnected && (
          <div className="space-y-3 border-t border-sage-200 pt-5">
            <div className="flex justify-between text-sm">
              <span className="text-sage-700 font-medium">Store</span>
              <span className="text-sage-900 font-mono">{config.shop_domain}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-sage-700 font-medium">Scopes</span>
              <span className="text-sage-900 font-mono">{config.scope || '—'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-sage-700 font-medium">Installiert am</span>
              <span className="text-sage-900">
                {config.installed_at ? new Date(config.installed_at).toLocaleString('de-CH') : '—'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Install action */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 mb-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-2 flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-slate-500" />
          {isConnected ? 'Neu verbinden / Token erneuern' : 'Jetzt verbinden'}
        </h2>
        <p className="text-sm text-slate-600 mb-5">
          {isConnected
            ? 'Falls der Token abgelaufen ist oder die App neu installiert wurde, hier erneut den OAuth-Flow ausführen.'
            : 'Klicke auf den Button, um den Shopify OAuth-Flow zu starten. Du wirst zu Shopify weitergeleitet und nach erfolgreicher Genehmigung automatisch zurückgeleitet.'}
        </p>

        {installUrl ? (
          <a
            href={installUrl}
            className="inline-flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-slate-800 transition"
          >
            <ExternalLink className="w-4 h-4" />
            {isConnected ? 'Token erneuern (OAuth)' : 'Mit Shopify verbinden (OAuth)'}
          </a>
        ) : (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
            <strong>SHOPIFY_INSTALL_SECRET</strong> ist nicht gesetzt. Setze diese Env-Variable, um den Install-Link zu aktivieren.
          </div>
        )}
      </div>

      {/* Setup checklist */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-5 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-slate-500" />
          Setup-Checkliste
        </h2>
        <ol className="space-y-4 text-sm">
          <li className="flex gap-3">
            <span className="w-6 h-6 flex-shrink-0 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-bold">1</span>
            <div>
              <p className="font-medium text-slate-900">Redirect URI in Shopify Partner Dashboard registrieren</p>
              <p className="text-slate-500 mt-0.5">Apps → deine App → App-Setup → Zulässige Weiterleitungs-URLs:</p>
              <code className="block mt-1.5 bg-stone-100 px-3 py-1.5 rounded-lg text-xs text-slate-700 break-all">
                {APP_URL}/api/shopify/callback
              </code>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="w-6 h-6 flex-shrink-0 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-bold">2</span>
            <div>
              <p className="font-medium text-slate-900">SHOPIFY_INSTALL_SECRET in Vercel setzen</p>
              <p className="text-slate-500 mt-0.5">Beliebiger, sicherer String — schützt den Install-Endpunkt.</p>
              <code className="block mt-1.5 bg-stone-100 px-3 py-1.5 rounded-lg text-xs text-slate-700">
                SHOPIFY_INSTALL_SECRET = ein-sicherer-zufallsstring
              </code>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="w-6 h-6 flex-shrink-0 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-bold">3</span>
            <div>
              <p className="font-medium text-slate-900">SQL-Migration ausführen</p>
              <p className="text-slate-500 mt-0.5">
                Datei <code className="bg-stone-100 px-1 rounded text-xs">supabase/migrations/shopify_config_table.sql</code> im Supabase SQL Editor ausführen.
              </p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="w-6 h-6 flex-shrink-0 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-bold">4</span>
            <div>
              <p className="font-medium text-slate-900">Redeploy → OAuth-Flow starten</p>
              <p className="text-slate-500 mt-0.5">Nach dem Redeploy den Button oben klicken und der Shopify-Genehmigung folgen.</p>
            </div>
          </li>
        </ol>
      </div>

      {/* Shopify Admin Link */}
      {SHOPIFY_DOMAIN && (
        <div className="mt-6 text-sm text-slate-500">
          <a
            href={`https://${SHOPIFY_DOMAIN}/admin/apps`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 hover:text-slate-800 transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Shopify Admin öffnen
          </a>
        </div>
      )}
    </div>
  );
}
