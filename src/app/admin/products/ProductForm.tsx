'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X, Tag, Trash2, ArrowLeft } from 'lucide-react';
import GalleryUploader from './GalleryUploader';

interface ProductFormProps {
  mode: 'create' | 'edit';
  initialData?: {
    id?: string;
    title?: string;
    short_description?: string;
    description?: string;
    price_in_cents?: number;
    usp?: string[];
    gallery_images?: string[];
    is_active?: boolean;
    stripe_price_id?: string;
  };
}

export default function ProductForm({ mode, initialData }: ProductFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [usps, setUsps] = useState<string[]>(initialData?.usp || []);
  const [newUsp, setNewUsp] = useState('');
  const [galleryImages, setGalleryImages] = useState<string[]>(initialData?.gallery_images || []);

  const addUsp = () => {
    if (newUsp.trim()) {
      setUsps([...usps, newUsp.trim()]);
      setNewUsp('');
    }
  };

  const removeUsp = (index: number) => {
    setUsps(usps.filter((_, i) => i !== index));
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);

    const payload = {
      id: initialData?.id,
      title: formData.get('title') as string,
      short_description: formData.get('short_description') as string,
      description: formData.get('description') as string,
      price_in_cents: Math.round(Number(formData.get('price')) * 100),
      usp: usps,
      gallery_images: galleryImages,
      is_active: formData.get('is_active') === 'on',
      stripe_price_id: formData.get('stripe_price_id') as string,
    };

    const endpoint = mode === 'create' ? '/api/admin/products' : `/api/admin/products/${initialData?.id}`;
    const method = mode === 'create' ? 'POST' : 'PATCH';

    const res = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Fehler beim Speichern');
      setIsLoading(false);
      return;
    }

    router.push('/admin/products');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* Left column: main fields */}
      <div className="lg:col-span-2 space-y-6">

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {/* Title */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">
            Produkttitel *
          </label>
          <input
            name="title"
            required
            defaultValue={initialData?.title}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-base focus:outline-none focus:ring-2 focus:ring-slate-300"
            placeholder="z.B. Premium Messing Medaillon"
          />
        </div>

        {/* Short Description (subtitle under H1) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">
            Kurzbeschreibung (unter Produkttitel)
          </label>
          <input
            name="short_description"
            defaultValue={initialData?.short_description}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
            placeholder="z.B. Wetterfest, elegant, in der Schweiz produziert."
          />
          <p className="text-xs text-slate-400 mt-2">Dieser Text erscheint als Untertitel auf der Produktseite.</p>
        </div>

        {/* Description */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">
            Produkt Beschreibung
          </label>
          <textarea
            name="description"
            rows={6}
            defaultValue={initialData?.description}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 resize-none"
            placeholder="Ausführliche Produktbeschreibung für Kunden..."
          />
        </div>

        {/* USPs */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">
            USPs / Vorteile
          </label>

          <div className="space-y-2 mb-4">
            {usps.map((usp, i) => (
              <div key={i} className="flex items-center gap-2 bg-stone-50 border border-stone-200 px-4 py-2.5 rounded-xl">
                <Tag className="w-3.5 h-3.5 text-sage-600 flex-shrink-0" />
                <span className="flex-grow text-sm text-slate-700">{usp}</span>
                <button type="button" onClick={() => removeUsp(i)} className="text-slate-400 hover:text-red-500 transition">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              value={newUsp}
              onChange={e => setNewUsp(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addUsp())}
              className="flex-grow px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
              placeholder="USP eingeben, z.B. Edelstahl, wetterfest..."
            />
            <button
              type="button"
              onClick={addUsp}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Hinzufügen
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-2">Enter-Taste oder Button zum Hinzufügen.</p>
        </div>

        {/* Gallery */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">
            Galerie (Produktbilder)
          </label>
          <GalleryUploader
            productId={initialData?.id}
            initialImages={galleryImages}
            onChange={setGalleryImages}
          />
        </div>
      </div>

      {/* Right column: sidebar */}
      <div className="space-y-6">

        {/* Publish / Status */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Status</h3>
          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative">
              <input
                name="is_active"
                type="checkbox"
                defaultChecked={initialData?.is_active !== false}
                className="sr-only peer"
              />
              <div className="w-10 h-6 bg-slate-200 peer-checked:bg-sage-600 rounded-full transition-colors peer" />
              <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow peer-checked:translate-x-4 transition-transform" />
            </div>
            <span className="text-sm text-slate-600">Produkt aktiv (auf Webseite sichtbar)</span>
          </label>
        </div>

        {/* Price */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">
            Preis (CHF) *
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">CHF</span>
            <input
              name="price"
              type="number"
              step="0.05"
              min="0"
              required
              defaultValue={initialData?.price_in_cents ? (initialData.price_in_cents / 100).toFixed(2) : ''}
              className="w-full pl-14 pr-4 py-3 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Stripe Price ID (optional metafield) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">
            Stripe Price ID (Optional)
          </label>
          <input
            name="stripe_price_id"
            defaultValue={initialData?.stripe_price_id}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-700 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-slate-300"
            placeholder="price_xxxxxxxxxxxxxxxx"
          />
          <p className="text-xs text-slate-400 mt-2">Verknüpft dieses Produkt mit einem bestehenden Stripe Preis.</p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-slate-800 transition disabled:opacity-50"
          >
            {isLoading ? 'Speichert...' : mode === 'create' ? 'Produkt anlegen' : 'Änderungen Speichern'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="w-full text-slate-500 py-2.5 rounded-xl text-sm hover:text-slate-800 flex items-center justify-center gap-1 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Abbrechen
          </button>
          {mode === 'edit' && initialData?.id && (
            <DeleteButton productId={initialData.id} />
          )}
        </div>
      </div>
    </form>
  );
}

function DeleteButton({ productId }: { productId: string }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);

  async function handleDelete() {
    await fetch(`/api/admin/products/${productId}`, { method: 'DELETE' });
    router.push('/admin/products');
    router.refresh();
  }

  return confirm ? (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
      <p className="text-sm text-red-700 mb-3">Wirklich löschen?</p>
      <div className="flex gap-2">
        <button onClick={() => setConfirm(false)} className="flex-1 text-sm border border-slate-200 py-2 rounded-lg">Nein</button>
        <button onClick={handleDelete} className="flex-1 text-sm bg-red-600 text-white py-2 rounded-lg hover:bg-red-700">Ja, löschen</button>
      </div>
    </div>
  ) : (
    <button
      type="button"
      onClick={() => setConfirm(true)}
      className="w-full text-red-500 py-2.5 rounded-xl text-sm hover:text-red-700 flex items-center justify-center gap-1 transition"
    >
      <Trash2 className="w-4 h-4" /> Produkt löschen
    </button>
  );
}
