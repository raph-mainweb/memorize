'use client';

import { useState, useCallback } from 'react';
import { Download, FileArchive, FileText, QrCode, Plus, RefreshCw, CheckCircle2, Loader2, Filter } from 'lucide-react';

interface Product { id: string; title: string; }
interface MedaillonCode {
  id: string;
  code: string;
  qr_url: string | null;
  batch: string | null;
  status: string | null;
  production_status: string | null;
  inventory_status: string | null;
  serial_number: string | null;
  notes: string | null;
  created_at: string;
  exported_at: string | null;
  produced_at: string | null;
  connected_at: string | null;
  shipped_at: string | null;
  products: { title: string } | null;
}

interface Props {
  products: Product[];
  initialCodes: MedaillonCode[];
  totalAvailable: number;
}

type Tab = 'generator' | 'wareneingang' | 'inventar';

const PROD_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  generated: { label: 'Generiert', color: 'bg-blue-50 text-blue-700' },
  exported: { label: 'Exportiert', color: 'bg-violet-50 text-violet-700' },
  produced: { label: 'Produziert', color: 'bg-sage-50 text-sage-700' },
};
const INV_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  in_stock: { label: 'Im Lager', color: 'bg-emerald-50 text-emerald-700' },
  reserved: { label: 'Reserviert', color: 'bg-amber-50 text-amber-700' },
  assigned: { label: 'Zugewiesen', color: 'bg-orange-50 text-orange-700' },
  connected: { label: 'Verbunden', color: 'bg-sage-50 text-sage-700' },
  shipped: { label: 'Versendet', color: 'bg-indigo-50 text-indigo-700' },
  activated: { label: 'Aktiviert', color: 'bg-green-50 text-green-700' },
};

function StatusBadge({ value, map }: { value: string | null; map: Record<string, { label: string; color: string }> }) {
  const entry = map[value || ''];
  if (!entry) return <span className="text-slate-400 text-xs">—</span>;
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${entry.color}`}>{entry.label}</span>;
}

export default function MedaillonManager({ products, initialCodes }: Omit<Props, 'totalAvailable'> & { totalAvailable?: number }) {
  const [tab, setTab] = useState<Tab>('generator');
  const [codes, setCodes] = useState<MedaillonCode[]>(initialCodes);

  // --- Generator state ---
  const [genProduct, setGenProduct] = useState('');
  const [genBatch, setGenBatch] = useState(() => {
    // Auto-suggest a batch name on first render
    const year = new Date().getFullYear();
    const seq = String(Math.floor(Math.random() * 900) + 100);
    return `MEDALLION-${year}-${seq}`;
  });
  const [genCount, setGenCount] = useState(10);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedBatch, setGeneratedBatch] = useState<{ codes: MedaillonCode[]; batch: string } | null>(null);
  const [genError, setGenError] = useState<string | null>(null);

  // --- Wareneingang state ---
  const [wiProduct, setWiProduct] = useState('');
  const [wiBatch, setWiBatch] = useState('');
  const [wiCodes, setWiCodes] = useState('');
  const [wiProdStatus, setWiProdStatus] = useState('produced');
  const [wiInvStatus, setWiInvStatus] = useState('in_stock');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // --- Inventar filters ---
  const [filterProduct, setFilterProduct] = useState('');
  const [filterBatch, setFilterBatch] = useState('');
  const [filterProd, setFilterProd] = useState('');
  const [filterInv, setFilterInv] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkProd, setBulkProd] = useState('');
  const [bulkInv, setBulkInv] = useState('');
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  // Suggest batch name based on selected product
  const suggestBatch = useCallback((productId: string) => {
    const p = products.find(p => p.id === productId);
    const prefix = p ? p.title.split(' ')[0].toUpperCase().replace(/[^A-Z]/g, '').slice(0, 8) : 'MEDALLION';
    const year = new Date().getFullYear();
    const seq = String(Math.floor(Math.random() * 900) + 100);
    return `${prefix}-${year}-${seq}`;
  }, [products]);

  // --- Generator submit ---
  async function handleGenerate() {
    if (genCount < 1 || genCount > 500) return;
    setIsGenerating(true);
    setGeneratedBatch(null);
    setGenError(null);

    // Auto-fill batch name if still empty
    const batchName = genBatch.trim() || (() => {
      const year = new Date().getFullYear();
      const seq = String(Math.floor(Math.random() * 900) + 100);
      return `MEDALLION-${year}-${seq}`;
    })();
    if (!genBatch.trim()) setGenBatch(batchName);

    try {
      const res = await fetch('/api/admin/qr/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: genProduct || undefined,
          count: genCount,
          batch_name: batchName,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setGenError(data.error || `Fehler ${res.status}: Generierung fehlgeschlagen`);
        return;
      }
      if (data.codes && data.codes.length > 0) {
        setGeneratedBatch({ codes: data.codes, batch: data.batch });
        setCodes(prev => [...data.codes, ...prev]);
      } else {
        setGenError('Keine Codes zurückgegeben — möglicherweise SQL-Migration noch nicht ausgeführt.');
      }
    } catch (e) {
      console.error('[Generate error]', e);
      setGenError(`Netzwerkfehler: ${e instanceof Error ? e.message : 'Unbekannte Ursache'}`);
    } finally {
      setIsGenerating(false);
    }
  }

  // --- Wareneingang submit ---
  async function handleWareneingang(e: React.FormEvent) {
    e.preventDefault();
    setIsUploading(true);
    setUploadSuccess(false);
    const codeArray = wiCodes.split(/[\n, ]+/).map(c => c.trim().toUpperCase()).filter(Boolean);
    if (codeArray.length === 0) { setIsUploading(false); return; }
    const siteUrl = window.location.origin;
    const payload = codeArray.map(code => ({
      code,
      qr_url: `${siteUrl}/m/${code}`,
      status: 'available',
      production_status: wiProdStatus,
      inventory_status: wiInvStatus,
      batch: wiBatch.trim() || `batch-${new Date().toISOString().split('T')[0]}`,
      product_id: wiProduct || null,
    }));
    const res = await fetch('/api/admin/qr/wareneingang', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codes: payload }),
    });
    if (res.ok) {
      const data = await res.json();
      setCodes(prev => [...(data.inserted || []), ...prev]);
      setWiCodes('');
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    }
    setIsUploading(false);
  }

  // --- Bulk status update ---
  async function handleBulkUpdate() {
    if (selectedIds.size === 0 || (!bulkProd && !bulkInv)) return;
    setIsBulkUpdating(true);
    await fetch('/api/admin/qr/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ids: Array.from(selectedIds),
        ...(bulkProd ? { production_status: bulkProd } : {}),
        ...(bulkInv ? { inventory_status: bulkInv } : {}),
      }),
    });
    // Refresh codes (simple approach: reload page data)
    window.location.reload();
  }

  // Filter codes for inventar tab
  const filteredCodes = codes.filter(c => {
    if (filterProduct && c.products?.title !== products.find(p => p.id === filterProduct)?.title) return false;
    if (filterBatch && c.batch !== filterBatch) return false;
    if (filterProd && c.production_status !== filterProd) return false;
    if (filterInv && c.inventory_status !== filterInv) return false;
    return true;
  });

  // Unique batches for filter dropdown
  const batches = Array.from(new Set(codes.map(c => c.batch).filter(Boolean) as string[])).sort();

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 bg-stone-100 rounded-2xl p-1 mb-8 w-fit">
        {([
          { key: 'generator', label: 'Generator', icon: QrCode },
          { key: 'wareneingang', label: 'Wareneingang', icon: Plus },
          { key: 'inventar', label: 'Inventar', icon: Filter },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition ${tab === key ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {/* ============================================================ */}
      {/* TAB: GENERATOR                                                */}
      {/* ============================================================ */}
      {tab === 'generator' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Form */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-slate-200 h-fit">
            <h2 className="font-serif text-xl mb-1">QR-Codes generieren</h2>
            <p className="text-sm text-slate-500 mb-6">Erstellt kryptografisch zufällige, eindeutige Codes und speichert sie im System.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Design / Produkt</label>
                <select
                  value={genProduct}
                  onChange={e => { setGenProduct(e.target.value); if (e.target.value) setGenBatch(suggestBatch(e.target.value)); }}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-sage-500"
                >
                  <option value="">Generisch (kein Design)</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Charge / Batch-Name</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={genBatch}
                    onChange={e => setGenBatch(e.target.value)}
                    placeholder="HERZ-2026-001"
                    className="flex-grow px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:border-sage-500"
                  />
                  <button
                    type="button"
                    onClick={() => setGenBatch(suggestBatch(genProduct))}
                    className="p-2.5 border border-slate-200 rounded-xl hover:bg-stone-50 transition"
                    title="Neuen Namen vorschlagen"
                  >
                    <RefreshCw className="w-4 h-4 text-slate-500" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Anzahl Codes</label>
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={genCount}
                  onChange={e => setGenCount(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-sage-500"
                />
                <p className="text-xs text-slate-400 mt-1">Max. 500 pro Generierung</p>
              </div>

              {genError && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                  <strong className="font-semibold">Fehler:</strong> {genError}
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full bg-slate-900 text-white py-3 rounded-xl font-semibold text-sm hover:bg-slate-800 transition flex items-center justify-center gap-2 disabled:opacity-40"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
                {isGenerating ? `Generiere ${genCount} Codes...` : `${genCount} Codes generieren`}
              </button>
            </div>
          </div>

          {/* Result */}
          <div className="lg:col-span-3">
            {generatedBatch ? (
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 bg-emerald-50/50">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">{generatedBatch.codes.length} Codes generiert</p>
                      <p className="text-xs text-slate-500">Charge: <span className="font-mono">{generatedBatch.batch}</span></p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={`/api/admin/qr/batch/${encodeURIComponent(generatedBatch.batch)}/csv`}
                      className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 hover:bg-stone-50 transition"
                    >
                      <FileText className="w-3.5 h-3.5" /> CSV
                    </a>
                    <a
                      href={`/api/admin/qr/batch/${encodeURIComponent(generatedBatch.batch)}`}
                      className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition"
                    >
                      <FileArchive className="w-3.5 h-3.5" /> ZIP herunterladen
                    </a>
                  </div>
                </div>
                <div className="overflow-auto max-h-96">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-stone-50 border-b border-slate-100 text-[10px] uppercase tracking-widest text-slate-400 sticky top-0">
                      <tr>
                        <th className="px-6 py-3">Code</th>
                        <th className="px-6 py-3">QR-URL</th>
                        <th className="px-4 py-3">SVG</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {generatedBatch.codes.map(c => (
                        <tr key={c.id} className="hover:bg-stone-50">
                          <td className="px-6 py-2.5 font-mono text-xs font-bold text-slate-800">{c.code}</td>
                          <td className="px-6 py-2.5 text-xs text-slate-400">/m/{c.code}</td>
                          <td className="px-4 py-2.5">
                            <a href={`/api/admin/qr/svg/${c.code}`} className="text-sage-700 hover:text-sage-900 transition" title={`SVG für ${c.code} herunterladen`}>
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 py-20 text-center">
                <div>
                  <QrCode className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">Fülle das Formular aus und klicke «Codes generieren»</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB: WARENEINGANG                                             */}
      {/* ============================================================ */}
      {tab === 'wareneingang' && (
        <div className="max-w-xl">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
            <h2 className="font-serif text-xl mb-1">Wareneingang (Manuell)</h2>
            <p className="text-sm text-slate-500 mb-6">Trage bereits produzierte Codes vom Hersteller ein.</p>
            <form onSubmit={handleWareneingang} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Design / Produkt</label>
                <select value={wiProduct} onChange={e => setWiProduct(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-sage-500">
                  <option value="">Generisch</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Charge / Batch</label>
                <input type="text" value={wiBatch} onChange={e => setWiBatch(e.target.value)} placeholder={`batch-${new Date().toISOString().split('T')[0]}`} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:border-sage-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Prod.-Status</label>
                  <select value={wiProdStatus} onChange={e => setWiProdStatus(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none">
                    <option value="generated">Generiert</option>
                    <option value="exported">Exportiert</option>
                    <option value="produced">Produziert</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Lager-Status</label>
                  <select value={wiInvStatus} onChange={e => setWiInvStatus(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none">
                    <option value="in_stock">Im Lager</option>
                    <option value="reserved">Reserviert</option>
                    <option value="assigned">Zugewiesen</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Codes (Einer pro Zeile oder Komma)</label>
                <textarea
                  name="codes"
                  rows={8}
                  value={wiCodes}
                  onChange={e => setWiCodes(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-mono text-xs focus:outline-none focus:border-sage-500"
                  placeholder="A1B2&#10;X9Y8&#10;C3D4"
                />
              </div>
              <button
                type="submit"
                disabled={isUploading}
                className="w-full bg-slate-900 text-white py-3 rounded-xl font-semibold text-sm hover:bg-slate-800 transition flex items-center justify-center gap-2 disabled:opacity-40"
              >
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                In den Bestand aufnehmen
              </button>
              {uploadSuccess && (
                <div className="flex items-center gap-2 text-emerald-700 text-sm font-medium">
                  <CheckCircle2 className="w-4 h-4" /> Erfolgreich eingetragen
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB: INVENTAR                                                 */}
      {/* ============================================================ */}
      {tab === 'inventar' && (
        <div>
          {/* Filters */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6 flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-slate-400 mb-1">Design</label>
              <select value={filterProduct} onChange={e => setFilterProduct(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none min-w-32">
                <option value="">Alle</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-slate-400 mb-1">Charge</label>
              <select value={filterBatch} onChange={e => setFilterBatch(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none min-w-36">
                <option value="">Alle</option>
                {batches.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-slate-400 mb-1">Prod.-Status</label>
              <select value={filterProd} onChange={e => setFilterProd(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none">
                <option value="">Alle</option>
                <option value="generated">Generiert</option>
                <option value="exported">Exportiert</option>
                <option value="produced">Produziert</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-slate-400 mb-1">Lager-Status</label>
              <select value={filterInv} onChange={e => setFilterInv(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none">
                <option value="">Alle</option>
                <option value="in_stock">Im Lager</option>
                <option value="reserved">Reserviert</option>
                <option value="assigned">Zugewiesen</option>
                <option value="connected">Verbunden</option>
                <option value="shipped">Versendet</option>
                <option value="activated">Aktiviert</option>
              </select>
            </div>
            <p className="text-xs text-slate-400 ml-auto self-center">{filteredCodes.length} Einträge</p>
          </div>

          {/* Bulk actions */}
          {selectedIds.size > 0 && (
            <div className="bg-slate-900 text-white rounded-2xl px-6 py-3 mb-4 flex items-center gap-4 flex-wrap">
              <span className="text-sm font-medium">{selectedIds.size} ausgewählt</span>
              <select value={bulkProd} onChange={e => setBulkProd(e.target.value)} className="bg-slate-800 text-white px-3 py-1.5 rounded-lg text-xs border border-slate-700 focus:outline-none">
                <option value="">Prod.-Status setzen…</option>
                <option value="generated">Generiert</option>
                <option value="exported">Exportiert</option>
                <option value="produced">Produziert</option>
              </select>
              <select value={bulkInv} onChange={e => setBulkInv(e.target.value)} className="bg-slate-800 text-white px-3 py-1.5 rounded-lg text-xs border border-slate-700 focus:outline-none">
                <option value="">Lager-Status setzen…</option>
                <option value="in_stock">Im Lager</option>
                <option value="reserved">Reserviert</option>
                <option value="assigned">Zugewiesen</option>
                <option value="connected">Verbunden</option>
                <option value="shipped">Versendet</option>
                <option value="activated">Aktiviert</option>
              </select>
              <button onClick={handleBulkUpdate} disabled={isBulkUpdating || (!bulkProd && !bulkInv)} className="bg-white text-slate-900 px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-stone-100 transition disabled:opacity-40">
                {isBulkUpdating ? 'Aktualisiere…' : 'Übernehmen'}
              </button>
              <button onClick={() => setSelectedIds(new Set())} className="text-slate-400 hover:text-white text-xs">Abbrechen</button>
            </div>
          )}

          {/* Table */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm min-w-[900px]">
                <thead className="bg-stone-50 border-b border-slate-100 text-[10px] uppercase tracking-widest text-slate-400">
                  <tr>
                    <th className="pl-5 pr-3 py-3">
                      <input type="checkbox" className="rounded" onChange={e => {
                        if (e.target.checked) setSelectedIds(new Set(filteredCodes.map(c => c.id)));
                        else setSelectedIds(new Set());
                      }} />
                    </th>
                    <th className="px-4 py-3">Code</th>
                    <th className="px-4 py-3">Design</th>
                    <th className="px-4 py-3">Charge</th>
                    <th className="px-4 py-3">Prod.</th>
                    <th className="px-4 py-3">Lager</th>
                    <th className="px-4 py-3">Erstellt</th>
                    <th className="px-4 py-3">Aktionen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCodes.map(c => (
                    <tr key={c.id} className={`hover:bg-stone-50 ${selectedIds.has(c.id) ? 'bg-blue-50/30' : ''}`}>
                      <td className="pl-5 pr-3 py-3">
                        <input
                          type="checkbox"
                          className="rounded"
                          checked={selectedIds.has(c.id)}
                          onChange={e => {
                            const next = new Set(selectedIds);
                            if (e.target.checked) next.add(c.id); else next.delete(c.id);
                            setSelectedIds(next);
                          }}
                        />
                      </td>
                      <td className="px-4 py-3 font-mono text-xs font-bold text-slate-800">{c.code}</td>
                      <td className="px-4 py-3 text-xs text-slate-600">{c.products?.title || <span className="text-slate-300">—</span>}</td>
                      <td className="px-4 py-3 text-xs font-mono text-slate-500">
                        {c.batch ? (
                          <span className="flex items-center gap-1.5">
                            {c.batch}
                            <a href={`/api/admin/qr/batch/${encodeURIComponent(c.batch)}`} className="text-slate-300 hover:text-sage-600" title="Ganze Charge als ZIP">
                              <FileArchive className="w-3 h-3" />
                            </a>
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3"><StatusBadge value={c.production_status} map={PROD_STATUS_LABELS} /></td>
                      <td className="px-4 py-3"><StatusBadge value={c.inventory_status} map={INV_STATUS_LABELS} /></td>
                      <td className="px-4 py-3 text-xs text-slate-400">
                        {c.created_at ? new Date(c.created_at).toLocaleDateString('de-CH') : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <a href={`/api/admin/qr/svg/${c.code}`} className="text-slate-400 hover:text-sage-700 transition" title="SVG herunterladen">
                          <Download className="w-4 h-4" />
                        </a>
                      </td>
                    </tr>
                  ))}
                  {filteredCodes.length === 0 && (
                    <tr><td colSpan={8} className="px-6 py-12 text-center text-slate-400 text-sm">Keine Codes für diese Filterauswahl.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
