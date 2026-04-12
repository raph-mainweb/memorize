'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Upload, CheckCircle2, AlertCircle, Loader2, ImageIcon, Palette, RefreshCw } from 'lucide-react';

interface BrandingClientProps {
  initialLogoUrl: string;
  initialColors: {
    primary: string;
    secondary: string;
    navy: string;
  };
}

export default function BrandingClient({ initialLogoUrl, initialColors }: BrandingClientProps) {
  // Logo state
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [logoStatus, setLogoStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [logoError, setLogoError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  // Colors state
  const [colors, setColors] = useState(initialColors);
  const [isSavingColors, setIsSavingColors] = useState(false);
  const [colorStatus, setColorStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // ─── Logo Upload ───────────────────────────────────────────────────
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;

    const validTypes = ['image/svg+xml', 'image/png', 'image/jpeg', 'image/webp'];
    if (!validTypes.includes(f.type)) {
      setLogoError('Ungültiger Dateityp – erlaubt: SVG, PNG, JPG, WebP');
      setLogoStatus('error');
      return;
    }
    if (f.size > 2 * 1024 * 1024) {
      setLogoError('Datei zu gross – max. 2 MB erlaubt');
      setLogoStatus('error');
      return;
    }

    setLogoFile(f);
    setLogoError('');
    setLogoStatus('idle');

    // Live preview
    const reader = new FileReader();
    reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
    reader.readAsDataURL(f);
  }

  async function handleLogoUpload() {
    if (!logoFile) return;
    setIsUploading(true);
    setLogoStatus('idle');
    setLogoError('');

    try {
      const fd = new FormData();
      fd.append('file', logoFile);

      const res = await fetch('/api/admin/settings/logo-upload', { method: 'POST', body: fd });
      const data = await res.json();

      if (!res.ok) {
        setLogoError(data.error || 'Upload fehlgeschlagen.');
        setLogoStatus('error');
        return;
      }

      setLogoUrl(data.url);
      setLogoPreview(null);
      setLogoFile(null);
      setLogoStatus('success');
      if (fileRef.current) fileRef.current.value = '';

      // Refresh navbar without full reload
      setTimeout(() => window.location.reload(), 800);
    } catch {
      setLogoError('Netzwerkfehler beim Upload.');
      setLogoStatus('error');
    } finally {
      setIsUploading(false);
    }
  }

  // ─── Colors ────────────────────────────────────────────────────────
  async function handleSaveColors() {
    setIsSavingColors(true);
    setColorStatus('idle');

    try {
      const res = await fetch('/api/admin/settings/brand-colors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(colors),
      });

      if (!res.ok) {
        setColorStatus('error');
        return;
      }

      setColorStatus('success');
      // Apply colors immediately as CSS variables
      const root = document.documentElement;
      root.style.setProperty('--brand-primary',   colors.primary);
      root.style.setProperty('--brand-secondary', colors.secondary);
      root.style.setProperty('--brand-navy',      colors.navy);

      setTimeout(() => setColorStatus('idle'), 3000);
    } catch {
      setColorStatus('error');
    } finally {
      setIsSavingColors(false);
    }
  }

  const colorFields: { key: keyof typeof colors; label: string; hint: string }[] = [
    { key: 'primary',   label: 'Primärfarbe (Buttons, Akzente)', hint: 'Standard: #968cb5' },
    { key: 'secondary', label: 'Sekundärfarbe (Hintergründe, Badges)', hint: 'Standard: #eae6f4' },
    { key: 'navy',      label: 'Dunkelfarbe (Logo-Text, Headlines)', hint: 'Standard: #1e2b5e' },
  ];

  return (
    <div className="space-y-8 max-w-2xl">

      {/* ─── Logo Upload ──────────────────────────────────────────── */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-heading font-medium text-slate-800 mb-1">Logo hochladen</h2>
        <p className="text-sm text-slate-400 mb-6">Das Logo erscheint in der Navigation und überall auf der Plattform.</p>

        {/* Current / Preview */}
        <div className="mb-6 p-4 bg-stone-50 rounded-2xl border border-slate-100">
          <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-3">
            {logoPreview ? 'Vorschau (noch nicht gespeichert)' : 'Aktuelles Logo'}
          </p>
          {(logoPreview || logoUrl) ? (
            <Image
              src={logoPreview || logoUrl}
              alt="Logo"
              width={220}
              height={56}
              className="h-12 w-auto object-contain"
              unoptimized={!!logoPreview}
            />
          ) : (
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <ImageIcon className="w-4 h-4" />
              Kein Logo hinterlegt
            </div>
          )}
        </div>

        {/* Drop Zone */}
        <div
          onClick={() => fileRef.current?.click()}
          className="group cursor-pointer border-2 border-dashed border-brand-200 hover:border-brand-400 rounded-2xl px-6 py-8 text-center transition-all bg-brand-50/30 hover:bg-brand-50"
        >
          <Upload className="w-8 h-8 text-brand-300 group-hover:text-brand-500 mx-auto mb-2 transition" />
          <p className="text-sm font-medium text-slate-700">
            {logoFile ? logoFile.name : 'Datei auswählen oder hierher ziehen'}
          </p>
          <p className="text-xs text-slate-400 mt-1">SVG, PNG, JPG, WebP — max. 2 MB</p>
          <input
            ref={fileRef}
            type="file"
            accept=".svg,.png,.jpg,.jpeg,.webp,image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* Status messages */}
        {logoStatus === 'error' && (
          <div className="mt-3 flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-xl px-4 py-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {logoError}
          </div>
        )}
        {logoStatus === 'success' && (
          <div className="mt-3 flex items-center gap-2 text-emerald-700 text-sm bg-emerald-50 rounded-xl px-4 py-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            Logo erfolgreich hochgeladen — Seite wird aktualisiert…
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <button
            onClick={handleLogoUpload}
            disabled={!logoFile || isUploading}
            className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-6 py-3 rounded-xl text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {isUploading ? 'Wird gespeichert…' : 'Logo speichern'}
          </button>
        </div>
      </div>

      {/* ─── Brand Colors ─────────────────────────────────────────── */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-heading font-medium text-slate-800 mb-1">Markenfarben</h2>
        <p className="text-sm text-slate-400 mb-6">Definiere die Hauptfarben der Plattform. Änderungen sind sofort sichtbar.</p>

        {/* Color preview bar */}
        <div className="flex h-8 rounded-xl overflow-hidden mb-6 shadow-sm">
          <div style={{ background: colors.primary }}   className="flex-1" title="Primär" />
          <div style={{ background: colors.secondary }} className="flex-1" title="Sekundär" />
          <div style={{ background: colors.navy }}      className="flex-1" title="Dunkel" />
        </div>

        <div className="space-y-5">
          {colorFields.map(({ key, label, hint }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
              <div className="flex items-center gap-3">
                {/* Native color picker */}
                <div className="relative">
                  <input
                    type="color"
                    value={colors[key]}
                    onChange={e => setColors(prev => ({ ...prev, [key]: e.target.value }))}
                    className="w-12 h-12 rounded-xl cursor-pointer border-2 border-slate-200 p-0.5 bg-transparent"
                    style={{ padding: 2 }}
                  />
                </div>

                {/* Hex input */}
                <input
                  type="text"
                  value={colors[key]}
                  maxLength={7}
                  onChange={e => {
                    const v = e.target.value;
                    if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) {
                      setColors(prev => ({ ...prev, [key]: v }));
                    }
                  }}
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm font-mono uppercase focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 bg-stone-50"
                />

                {/* Reset button */}
                <button
                  type="button"
                  onClick={() => {
                    const defaults = { primary: '#968cb5', secondary: '#eae6f4', navy: '#1e2b5e' };
                    setColors(prev => ({ ...prev, [key]: defaults[key] }));
                  }}
                  className="p-3 rounded-xl border border-slate-200 hover:bg-stone-50 text-slate-400 hover:text-slate-600 transition"
                  title="Zurücksetzen"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-1">{hint}</p>
            </div>
          ))}
        </div>

        {colorStatus === 'success' && (
          <div className="mt-4 flex items-center gap-2 text-emerald-700 text-sm bg-emerald-50 rounded-xl px-4 py-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            Farben gespeichert und sofort angewendet
          </div>
        )}
        {colorStatus === 'error' && (
          <div className="mt-4 flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-xl px-4 py-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            Fehler beim Speichern der Farben
          </div>
        )}

        <div className="mt-6 flex items-center gap-3 justify-between">
          <p className="text-xs text-slate-400 flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5" />
            Farben werden als CSS-Variablen global angewendet
          </p>
          <button
            onClick={handleSaveColors}
            disabled={isSavingColors}
            className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-6 py-3 rounded-xl text-sm font-medium transition disabled:opacity-40"
          >
            {isSavingColors ? <Loader2 className="w-4 h-4 animate-spin" /> : <Palette className="w-4 h-4" />}
            {isSavingColors ? 'Wird gespeichert…' : 'Farben speichern'}
          </button>
        </div>
      </div>
    </div>
  );
}
