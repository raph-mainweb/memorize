/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import PreviewMemorial from '@/components/builder/PreviewMemorial';
import AuthModal from './AuthModal';
import {
  Save, ChevronLeft, Image as ImageIcon, Calendar, AlignLeft,
  LayoutPanelLeft, BadgeCheck, Camera, Plus, Trash2, Loader2,
  Sparkles, ArrowRight, ExternalLink,
} from 'lucide-react';

const WP_URL = process.env.NEXT_PUBLIC_WP_URL || 'https://memorize.mainwebsite.ch';

// ── Types ────────────────────────────────────────────────────────────────────
interface GuestData {
  name: string;
  type: 'human' | 'pet';
  slug: string;
  biography: string;
  birth_date: string;
  birth_place: string;
  death_date: string;
  death_place: string;
  title_image: string | null;   // Object URL for preview
  profile_image: string | null; // Object URL for preview
  gallery: { url: string; caption: string }[]; // url = Object URL
}

interface ImageFiles {
  title_image: File | null;
  profile_image: File | null;
  gallery: File[];
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function GuestBuilderClient() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<'wizard' | 'builder'>('wizard');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [data, setData] = useState<GuestData>({
    name: '', type: 'human', slug: '',
    biography: '', birth_date: '', birth_place: '',
    death_date: '', death_place: '',
    title_image: null, profile_image: null, gallery: [],
  });

  // Actual File objects stored separately
  const [files, setFiles] = useState<ImageFiles>({
    title_image: null, profile_image: null, gallery: [],
  });

  // ── Wizard submit ──────────────────────────────────────────────────────────
  const handleWizardNext = () => {
    if (!data.name.trim()) return;
    const baseSlug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'gedenkseite';
    setData(p => ({ ...p, slug: `${baseSlug}-${Math.floor(Date.now() / 1000).toString(36)}` }));
    setStep('builder');
  };

  // ── Image upload (Object URL) ───────────────────────────────────────────────
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'title_image' | 'profile_image') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setData(p => ({ ...p, [field]: url }));
    setFiles(p => ({ ...p, [field]: file }));
  };

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setData(p => ({ ...p, gallery: [...p.gallery, { url, caption: '' }] }));
    setFiles(p => ({ ...p, gallery: [...p.gallery, file] }));
  };

  const removeGalleryImage = (idx: number) => {
    setData(p => ({ ...p, gallery: p.gallery.filter((_, i) => i !== idx) }));
    setFiles(p => ({ ...p, gallery: p.gallery.filter((_, i) => i !== idx) }));
  };

  const updateCaption = (idx: number, caption: string) => {
    setData(p => {
      const g = [...p.gallery];
      g[idx] = { ...g[idx], caption };
      return { ...p, gallery: g };
    });
  };

  // ── Save: check auth → open modal or save directly ─────────────────────────
  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setShowAuthModal(true); return; }
    await persistToDb(user.id);
  };

  // ── After auth: upload files + create DB record ────────────────────────────
  const persistToDb = useCallback(async (userId: string) => {
    setIsSaving(true);
    setShowAuthModal(false);

    const uploadFile = async (file: File, folder: string, name: string): Promise<string | null> => {
      const ext = file.name.split('.').pop();
      const path = `${folder}/${userId}-${name}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('memorial-media').upload(path, file);
      if (error) return null;
      return supabase.storage.from('memorial-media').getPublicUrl(path).data.publicUrl;
    };

    const titleUrl   = files.title_image   ? await uploadFile(files.title_image,   'title_images',   'title')   : null;
    const profileUrl = files.profile_image ? await uploadFile(files.profile_image, 'profile_images', 'profile') : null;

    const galleryRows: { url: string; caption: string }[] = [];
    for (let i = 0; i < files.gallery.length; i++) {
      const url = await uploadFile(files.gallery[i], 'gallery', `g${i}`);
      if (url) galleryRows.push({ url, caption: data.gallery[i]?.caption || '' });
    }

    const { data: row, error } = await supabase
      .from('memorial_pages')
      .insert({
        user_id:       userId,
        name:          data.name,
        type:          data.type,
        slug:          data.slug,
        is_live:       false,
        biography:     data.biography || null,
        birth_date:    data.birth_date || null,
        birth_place:   data.birth_place || null,
        death_date:    data.death_date || null,
        death_place:   data.death_place || null,
        title_image:   titleUrl,
        profile_image: profileUrl,
        gallery:       galleryRows,
      })
      .select('id')
      .single();

    setIsSaving(false);
    if (error || !row) { alert('Fehler beim Speichern: ' + error?.message); return; }
    router.push(`/dashboard/edit/${row.id}`);
  }, [data, files, supabase, router]);

  // ── WIZARD VIEW ────────────────────────────────────────────────────────────
  if (step === 'wizard') {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <a href={WP_URL} className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-700 transition mb-10">
            <ChevronLeft className="w-4 h-4" />
            Zurück zu nachklang.ch
          </a>

          <div className="bg-white rounded-[2.5rem] p-8 sm:p-10 shadow-xl shadow-stone-200/50 border border-white relative overflow-hidden">
            <div className="absolute top-[-20%] right-[-10%] w-[250px] h-[250px] rounded-full bg-sage-100/40 blur-[80px] -z-10" />

            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-2xl bg-stone-50 border border-stone-100 flex items-center justify-center mx-auto mb-5">
                <Sparkles className="w-7 h-7 text-sage-600" />
              </div>
              <h1 className="text-2xl font-serif text-slate-900 mb-2">Gedenkseite erstellen</h1>
              <p className="text-slate-500 font-light text-sm">Kostenlos — kein Konto nötig zum Starten.</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 ml-1">Um wen geht es?</label>
                <div className="grid grid-cols-2 gap-3">
                  {(['human', 'pet'] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setData(p => ({ ...p, type: t }))}
                      className={`py-3.5 rounded-2xl border text-sm font-medium transition-all ${data.type === t ? 'border-sage-500 bg-sage-50 text-sage-900 shadow-inner' : 'border-slate-200 text-slate-500 hover:bg-stone-50'}`}
                    >
                      {t === 'human' ? 'Mensch' : 'Haustier'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 ml-1">Vollständiger Name</label>
                <input
                  type="text"
                  value={data.name}
                  onChange={e => setData(p => ({ ...p, name: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && handleWizardNext()}
                  placeholder="z.B. Maria Baumann"
                  autoFocus
                  className="w-full px-4 py-3.5 bg-stone-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-sage-400 focus:border-sage-400 focus:bg-white transition text-slate-900 text-base placeholder:text-slate-400"
                />
              </div>

              <button
                onClick={handleWizardNext}
                disabled={!data.name.trim()}
                className="w-full py-4 rounded-2xl bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 transition flex items-center justify-center gap-2 disabled:opacity-40 shadow-lg"
              >
                Zum Builder <ArrowRight className="w-4 h-4 opacity-70" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── BUILDER VIEW ───────────────────────────────────────────────────────────
  return (
    <>
      {showAuthModal && (
        <AuthModal
          onSuccess={() => supabase.auth.getUser().then(({ data: { user } }) => user && persistToDb(user.id))}
          onClose={() => setShowAuthModal(false)}
        />
      )}

      <div className="flex h-screen bg-stone-100 overflow-hidden font-sans">

        {/* LEFT SIDEBAR */}
        <div className="w-full lg:w-[460px] xl:w-[500px] flex-shrink-0 bg-white border-r border-stone-200 flex flex-col z-20 shadow-2xl lg:shadow-none h-full hidden lg:flex">

          {/* Header */}
          <div className="p-5 border-b border-stone-100 sticky top-0 bg-white/90 backdrop-blur-md z-10">
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setStep('wizard')} className="w-9 h-9 rounded-full border border-stone-200 flex items-center justify-center text-slate-500 hover:bg-stone-50 transition">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100">
                Gast-Modus
              </div>
            </div>
            <h1 className="text-xl font-serif text-slate-900">Gedenkseite gestalten</h1>
            <p className="text-xs text-slate-500 mt-1">Änderungen werden live in der Vorschau angezeigt.</p>

            {/* Save reminder banner */}
            <div className="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
              <Save className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
              <p className="text-[11px] text-amber-700 leading-snug">
                Deine Eingaben werden erst nach dem Anmelden gespeichert — lass dieses Fenster offen.
              </p>
            </div>
          </div>

          {/* Builder Controls */}
          <div className="p-5 flex-grow space-y-7 overflow-y-auto">

            {/* Allgemein */}
            <section>
              <div className="flex items-center gap-2 mb-3 text-slate-900 font-serif">
                <LayoutPanelLeft className="w-4 h-4 text-sage-500" />
                <h2 className="text-lg">Allgemein</h2>
              </div>
              <div className="bg-stone-50 rounded-2xl p-4 border border-stone-100 space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 ml-1">Name</label>
                  <input type="text" value={data.name} onChange={e => setData(p => ({ ...p, name: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-sage-400 transition text-sm text-slate-900" />
                </div>
              </div>
            </section>

            {/* Titelbild & Profilbild */}
            <section>
              <div className="flex items-center gap-2 mb-3 text-slate-900 font-serif">
                <ImageIcon className="w-4 h-4 text-sage-500" />
                <h2 className="text-lg">Titel &amp; Profilbild</h2>
              </div>
              <div className="bg-stone-50 rounded-2xl p-4 border border-stone-100 space-y-4">
                {/* Title Image */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 ml-1">Titelbild</label>
                  <label className="relative w-full h-28 bg-white border-2 border-dashed border-stone-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-sage-400 transition group overflow-hidden">
                    {data.title_image ? (
                      <>
                        <img src={data.title_image} className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-30 transition" alt="" />
                        <span className="relative z-10 bg-white/90 backdrop-blur text-xs font-medium px-3 py-1 rounded-full shadow-sm text-slate-700">Bild ändern</span>
                      </>
                    ) : (
                      <>
                        <Camera className="w-5 h-5 text-stone-400 mb-1.5 group-hover:text-sage-500 transition" />
                        <span className="text-xs text-stone-500 font-medium">Klicken zum Auswählen</span>
                      </>
                    )}
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/jpeg,image/png,image/webp" onChange={e => handleImageUpload(e, 'title_image')} />
                  </label>
                </div>
                {/* Profile Image */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 ml-1">Profilbild (1:1)</label>
                  <label className="relative w-20 h-20 bg-white border-2 border-dashed border-stone-200 rounded-2xl flex items-center justify-center cursor-pointer hover:border-sage-400 transition group overflow-hidden">
                    {data.profile_image ? (
                      <>
                        <img src={data.profile_image} className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-30 transition" alt="" />
                        <Camera className="w-4 h-4 text-slate-700 relative z-10" />
                      </>
                    ) : (
                      <Camera className="w-5 h-5 text-stone-400 group-hover:text-sage-500 transition" />
                    )}
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/jpeg,image/png,image/webp" onChange={e => handleImageUpload(e, 'profile_image')} />
                  </label>
                </div>
              </div>
            </section>

            {/* Kerndaten */}
            <section>
              <div className="flex items-center gap-2 mb-3 text-slate-900 font-serif">
                <Calendar className="w-4 h-4 text-sage-500" />
                <h2 className="text-lg">Kerndaten</h2>
              </div>
              <div className="bg-stone-50 rounded-2xl p-4 border border-stone-100 space-y-4">
                <div className="space-y-2">
                  <h3 className="text-[10px] font-bold text-slate-600 uppercase tracking-wider ml-1 flex items-center gap-1.5"><Sparkles className="w-3 h-3 text-sage-400" />Geburt</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="date" value={data.birth_date} onChange={e => setData(p => ({ ...p, birth_date: e.target.value }))} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-sage-400 text-sm" />
                    <input type="text" placeholder="Ort" value={data.birth_place} onChange={e => setData(p => ({ ...p, birth_place: e.target.value }))} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-sage-400 text-sm" />
                  </div>
                </div>
                <div className="w-full h-px bg-stone-200/60" />
                <div className="space-y-2">
                  <h3 className="text-[10px] font-bold text-slate-600 uppercase tracking-wider ml-1 flex items-center gap-1.5"><BadgeCheck className="w-3 h-3 text-slate-400" />Tod</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="date" value={data.death_date} onChange={e => setData(p => ({ ...p, death_date: e.target.value }))} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-sage-400 text-sm" />
                    <input type="text" placeholder="Ort" value={data.death_place} onChange={e => setData(p => ({ ...p, death_place: e.target.value }))} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-sage-400 text-sm" />
                  </div>
                </div>
              </div>
            </section>

            {/* Lebensgeschichte */}
            <section>
              <div className="flex items-center gap-2 mb-3 text-slate-900 font-serif">
                <AlignLeft className="w-4 h-4 text-sage-500" />
                <h2 className="text-lg">Lebensgeschichte</h2>
              </div>
              <div className="bg-stone-50 rounded-2xl p-4 border border-stone-100">
                <textarea
                  value={data.biography}
                  onChange={e => setData(p => ({ ...p, biography: e.target.value }))}
                  placeholder="Wie würdest du dieses Leben beschreiben? Welche Momente bleiben für immer in Erinnerung?"
                  rows={7}
                  className="w-full px-3 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-sage-400 transition text-sm text-slate-700 leading-relaxed resize-none"
                />
              </div>
            </section>

            {/* Galerie */}
            <section className="pb-4">
              <div className="flex items-center gap-2 mb-3 text-slate-900 font-serif">
                <ImageIcon className="w-4 h-4 text-sage-500" />
                <h2 className="text-lg">Galerie</h2>
              </div>
              <div className="bg-stone-50 rounded-2xl p-4 border border-stone-100">
                <div className="grid grid-cols-3 gap-3">
                  {data.gallery.map((img, idx) => (
                    <div key={idx} className="relative group">
                      <div className="aspect-square rounded-xl overflow-hidden bg-stone-200">
                        <img src={img.url} className="w-full h-full object-cover" alt="" />
                      </div>
                      <button onClick={() => removeGalleryImage(idx)} className="absolute top-1 right-1 bg-white/90 text-red-500 p-1 rounded-full opacity-0 group-hover:opacity-100 transition shadow-sm">
                        <Trash2 className="w-3 h-3" />
                      </button>
                      <input type="text" value={img.caption} onChange={e => updateCaption(idx, e.target.value)} placeholder="Beschreibung..." maxLength={60}
                        className="mt-1 text-[10px] px-2 py-1 w-full bg-white border border-stone-200 rounded-lg outline-none focus:border-sage-300 text-slate-600" />
                    </div>
                  ))}
                  {data.gallery.length < 20 && (
                    <label className="aspect-square bg-white border-2 border-dashed border-stone-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-sage-400 transition relative">
                      <Plus className="w-5 h-5 text-stone-400" />
                      <span className="text-[10px] text-stone-500 mt-1">Hinzufügen</span>
                      <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/jpeg,image/png,image/webp" onChange={handleGalleryUpload} />
                    </label>
                  )}
                </div>
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-stone-100 bg-white sticky bottom-0 z-10 space-y-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full bg-slate-900 text-white rounded-xl py-3.5 flex items-center justify-center gap-2 font-semibold text-sm hover:bg-slate-800 transition shadow-md disabled:opacity-50"
            >
              {isSaving ? <><Loader2 className="w-4 h-4 animate-spin" />Wird gespeichert...</> : <><Save className="w-4 h-4" />Gedenkseite speichern</>}
            </button>
            <a
              href={WP_URL}
              className="w-full flex items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition py-1"
            >
              <ExternalLink className="w-3 h-3" />
              Zurück zu nachklang.ch
            </a>
          </div>
        </div>

        {/* RIGHT PREVIEW */}
        <div className="flex-1 bg-stone-300 relative lg:overflow-y-auto">
          <div className="absolute inset-0 flex flex-col">
            <div className="h-12 bg-stone-800 flex items-center justify-between px-5 flex-shrink-0">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400/30" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/30" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-400/30" />
              </div>
              <div className="bg-stone-700/50 rounded-full px-4 py-1 text-xs text-stone-400 font-medium">
                Vorschau — wird nach dem Speichern veröffentlicht
              </div>
              <div />
            </div>
            <div className="flex-1 overflow-y-auto w-full flex justify-center">
              <div className="w-full max-w-[640px] xl:max-w-none bg-white shadow-2xl">
                <PreviewMemorial data={data} />
              </div>
            </div>
          </div>
        </div>

        {/* Mobile notice */}
        <div className="fixed inset-0 z-50 bg-stone-50 flex lg:hidden flex-col items-center justify-center p-8 text-center">
          <LayoutPanelLeft className="w-10 h-10 text-slate-300 mb-4" />
          <h2 className="text-xl font-serif text-slate-900 mb-2">Bitte Laptop nutzen</h2>
          <p className="text-slate-500 text-sm leading-relaxed max-w-sm">
            Der Page Builder ist für grössere Bildschirme optimiert.
          </p>
          <a href={WP_URL} className="mt-6 px-6 py-3 bg-slate-900 text-white rounded-full text-sm font-medium">
            Zurück zu nachklang.ch
          </a>
        </div>
      </div>
    </>
  );
}
