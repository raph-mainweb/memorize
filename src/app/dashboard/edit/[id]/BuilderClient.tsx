/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import SectionEditor from '@/app/gedenken/neu/SectionEditor';
import PreviewMemorial from '@/components/builder/PreviewMemorial';
import UnlockModal from '@/app/dashboard/UnlockModal';
import type { MemorialState, SectionId, ImageFiles } from '@/app/gedenken/neu/GuestBuilderClient';
import {
  Save, ChevronLeft, Loader2, Eye, CheckCircle2, ExternalLink,
  User, AlignLeft, MapPin, Image as ImageIcon,
  Music, Flame, Calendar, Globe, Heart, QrCode, Lock,
} from 'lucide-react';
import Link from 'next/link';

// ── Section nav definition (mirrors GuestBuilderClient) ───────────────────────
const SECTIONS: { id: SectionId; label: string; icon: React.ElementType }[] = [
  { id: 'title',     label: 'Titelbereich',      icon: User },
  { id: 'biography', label: 'Lebensgeschichte',   icon: AlignLeft },
  { id: 'timeline',  label: 'Lebensstationen',    icon: MapPin },
  { id: 'gallery',   label: 'Bildergalerie',      icon: ImageIcon },
  { id: 'music',     label: 'Musik & Video',      icon: Music },
  { id: 'candles',   label: 'Gedenkkerzen',       icon: Flame },
  { id: 'funeral',   label: 'Bestattungsinfos',   icon: Calendar },
  { id: 'grave',     label: 'Grabstandort',       icon: Globe },
  { id: 'donation',  label: 'Spenden & Links',    icon: Heart },
  { id: 'qr',        label: 'QR-Medaillon',       icon: QrCode },
  { id: 'privacy',   label: 'Privatsphäre',       icon: Lock },
];

// ── Map DB record → MemorialState ─────────────────────────────────────────────
function fromDb(d: any): MemorialState {
  const m = d.meta ?? {};
  return {
    name:          d.name ?? '',
    type:          d.type ?? 'human',
    slug:          d.slug ?? '',
    subtitle:      m.subtitle ?? 'In liebevoller Erinnerung',
    birth_date:    d.birth_date ?? '',
    birth_place:   d.birth_place ?? '',
    death_date:    d.death_date ?? '',
    death_place:   d.death_place ?? '',
    title_image:   d.title_image ?? null,
    profile_image: d.profile_image ?? null,
    color_theme:   m.color_theme ?? 'sage',
    biography:     d.biography ?? '',
    biography_font_size: m.biography_font_size ?? 'md',
    timeline:      m.timeline ?? [],
    gallery:       d.gallery ?? [],
    gallery_layout:m.gallery_layout ?? 'grid',
    spotify_url:   m.spotify_url ?? '',
    youtube_url:   m.youtube_url ?? '',
    video_caption: m.video_caption ?? '',
    candles_enabled:         m.candles_enabled        ?? true,
    candles_allow_message:   m.candles_allow_message   ?? true,
    candles_message_required:m.candles_message_required ?? false,
    candles_moderated:       m.candles_moderated       ?? false,
    funeral_date:    m.funeral_date    ?? '',
    funeral_time:    m.funeral_time    ?? '',
    funeral_location:m.funeral_location ?? '',
    funeral_address: m.funeral_address  ?? '',
    funeral_notes:   m.funeral_notes    ?? '',
    grave_cemetery:  m.grave_cemetery   ?? '',
    grave_field:     m.grave_field      ?? '',
    grave_maps_url:  m.grave_maps_url   ?? '',
    donation_url:    m.donation_url     ?? '',
    donation_title:  m.donation_title   ?? '',
    donation_description: m.donation_description ?? '',
    donation_button_text: m.donation_button_text ?? 'Jetzt spenden',
    visibility:    m.visibility   ?? 'public',
    page_password: m.page_password ?? '',
    is_live:       d.is_live ?? false,
  };
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function BuilderClient({ initialData }: { initialData: any }) {
  const supabase = createClient();
  const id = initialData.id as string;

  const [data, setData]         = useState<MemorialState>(() => fromDb(initialData));
  const [files, setFiles]       = useState<ImageFiles>({ title_image: null, profile_image: null, gallery: [] });
  const [activeSection, setActiveSection] = useState<SectionId>('title');
  const [mobileTab, setMobileTab]         = useState<'nav' | 'editor' | 'preview'>('editor');
  const [isSaving, setIsSaving]   = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [isDirty, setIsDirty]     = useState(false);
  const [savedAt, setSavedAt]     = useState<Date | null>(null);

  // ── State helpers ──────────────────────────────────────────────────────────
  const update = useCallback((patch: Partial<MemorialState>) => {
    setData(p => ({ ...p, ...patch }));
    setIsDirty(true);
  }, []);

  // Upload directly to Supabase (user is already authenticated)
  const uploadFile = async (file: File, folder: string, name: string): Promise<string | null> => {
    const ext = file.name.split('.').pop();
    const path = `${folder}/${id}-${name}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('memorial-media').upload(path, file);
    if (error) { alert('Upload-Fehler: ' + error.message); return null; }
    return supabase.storage.from('memorial-media').getPublicUrl(path).data.publicUrl;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'title_image' | 'profile_image') => {
    const file = e.target.files?.[0]; if (!file) return;
    // Show preview immediately via Object URL
    update({ [field]: URL.createObjectURL(file) });
    setFiles(p => ({ ...p, [field]: file }));
  };

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const url = URL.createObjectURL(file);
    setData(p => ({ ...p, gallery: [...p.gallery, { url, caption: '' }] }));
    setFiles(p => ({ ...p, gallery: [...p.gallery, file] }));
    setIsDirty(true);
  };

  const removeGalleryImage = (idx: number) => {
    setData(p => ({ ...p, gallery: p.gallery.filter((_, i) => i !== idx) }));
    setFiles(p => ({ ...p, gallery: p.gallery.filter((_, i) => i !== idx) }));
    setIsDirty(true);
  };

  const updateCaption = (idx: number, caption: string) => {
    setData(p => { const g = [...p.gallery]; g[idx] = { ...g[idx], caption }; return { ...p, gallery: g }; });
    setIsDirty(true);
  };

  // ── Save (DB update) ───────────────────────────────────────────────────────
  const handleSave = async () => {
    setIsSaving(true);

    // Upload any new image files
    let titleUrl   = data.title_image;
    let profileUrl = data.profile_image;
    const galleryRows = [...data.gallery];

    if (files.title_image)   titleUrl   = await uploadFile(files.title_image,   'title_images',   'title')   ?? titleUrl;
    if (files.profile_image) profileUrl = await uploadFile(files.profile_image, 'profile_images', 'profile') ?? profileUrl;

    // Upload new gallery images (those that are Object URLs from File objects)
    for (let i = 0; i < files.gallery.length; i++) {
      // Find the gallery entry that corresponds to this File (it will have a blob: URL)
      const blobEntries = data.gallery.filter(g => g.url.startsWith('blob:'));
      if (blobEntries[i]) {
        const url = await uploadFile(files.gallery[i], 'gallery', `g${Date.now()}-${i}`);
        if (url) {
          const galleryIdx = data.gallery.findIndex(g => g.url === blobEntries[i].url);
          if (galleryIdx !== -1) galleryRows[galleryIdx] = { ...galleryRows[galleryIdx], url };
        }
      }
    }

    const meta = {
      subtitle: data.subtitle, color_theme: data.color_theme,
      biography_font_size: data.biography_font_size,
      timeline: data.timeline, gallery_layout: data.gallery_layout,
      spotify_url: data.spotify_url, youtube_url: data.youtube_url, video_caption: data.video_caption,
      candles_enabled: data.candles_enabled, candles_allow_message: data.candles_allow_message,
      candles_message_required: data.candles_message_required, candles_moderated: data.candles_moderated,
      funeral_date: data.funeral_date, funeral_time: data.funeral_time,
      funeral_location: data.funeral_location, funeral_address: data.funeral_address, funeral_notes: data.funeral_notes,
      grave_cemetery: data.grave_cemetery, grave_field: data.grave_field, grave_maps_url: data.grave_maps_url,
      donation_url: data.donation_url, donation_title: data.donation_title,
      donation_description: data.donation_description, donation_button_text: data.donation_button_text,
      visibility: data.visibility, page_password: data.page_password,
    };

    const { error } = await supabase
      .from('memorial_pages')
      .update({
        name: data.name, slug: data.slug, biography: data.biography || null,
        birth_date: data.birth_date || null, birth_place: data.birth_place || null,
        death_date: data.death_date || null, death_place: data.death_place || null,
        title_image: titleUrl, profile_image: profileUrl,
        gallery: galleryRows, meta,
      })
      .eq('id', id);

    setIsSaving(false);
    if (error) { alert('Fehler beim Speichern: ' + error.message); return; }

    // Update state with final Supabase URLs
    setData(p => ({ ...p, title_image: titleUrl, profile_image: profileUrl, gallery: galleryRows }));
    setFiles({ title_image: null, profile_image: null, gallery: [] });
    setIsDirty(false);
    setSavedAt(new Date());
  };

  // ── Unlock: speichern, dann Modal öffnen ───────────────────────────────
  const handleUnlockClick = async () => {
    // Erst speichern damit alle Daten in der DB sind
    if (isDirty) await handleSave();
    setShowUnlockModal(true);
  };

  const activeLabel = SECTIONS.find(s => s.id === activeSection)?.label ?? '';

  return (
    <>
      {showUnlockModal && (
        <UnlockModal
          memorialId={id}
          onClose={() => setShowUnlockModal(false)}
        />
      )}
      {/* ── Mobile notice ── */}
      <div className="fixed inset-0 z-[60] bg-stone-50 lg:hidden flex flex-col">
        <div className="flex border-b border-stone-200 bg-white flex-shrink-0">
          {(['nav', 'editor', 'preview'] as const).map(tab => (
            <button key={tab} onClick={() => setMobileTab(tab)}
              className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition ${mobileTab === tab ? 'text-slate-900 border-b-2 border-slate-900' : 'text-slate-400'}`}>
              {tab === 'nav' ? 'Inhalte' : tab === 'editor' ? activeLabel : 'Vorschau'}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto">
          {mobileTab === 'nav' && <SectionNav active={activeSection} onSelect={id => { setActiveSection(id); setMobileTab('editor'); }} />}
          {mobileTab === 'editor' && (
            <div className="p-4">
              <SectionEditor activeSection={activeSection} data={data} update={update}
                files={files} onImageUpload={handleImageUpload}
                onGalleryUpload={handleGalleryUpload} onGalleryRemove={removeGalleryImage}
                onGalleryCaption={updateCaption} />
            </div>
          )}
          {mobileTab === 'preview' && <PreviewMemorial data={data} />}
        </div>
        <MobileSaveBar isSaving={isSaving} isDirty={isDirty} savedAt={savedAt} onSave={handleSave} isLive={data.is_live} onUnlock={handleUnlockClick} />
      </div>

      {/* ── Desktop 3-column layout ── */}
      <div className="hidden lg:flex fixed inset-0 z-50 flex-col bg-stone-100">
        <div className="flex flex-1 overflow-hidden">

          {/* Left: Section Nav */}
          <aside className="w-56 xl:w-64 bg-white border-r border-stone-100 flex flex-col flex-shrink-0">
            <div className="px-4 py-5 border-b border-stone-100 flex-shrink-0">
              <Link href="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-slate-700 transition mb-3">
                <ChevronLeft className="w-4 h-4" /><span className="text-xs font-medium">Dashboard</span>
              </Link>
              <span className="font-serif text-base text-slate-900">{data.name || 'Gedenkseite'}</span>
              <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wider">Inhalte bearbeiten</p>
            </div>
            <SectionNav active={activeSection} onSelect={setActiveSection} />
            <div className="mt-auto p-4 border-t border-stone-100">
              {data.is_live ? (
                <a href={`${process.env.NEXT_PUBLIC_APP_URL || ''}/gedenken/${data.slug}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-sage-600 hover:text-sage-700 transition">
                  <ExternalLink className="w-3 h-3" /> Gedenkseite ansehen
                </a>
              ) : (
                <span className="flex items-center gap-1.5 text-xs text-amber-500">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Nicht veröffentlicht
                </span>
              )}
            </div>
          </aside>

          {/* Middle: Editor */}
          <main className="w-[400px] xl:w-[460px] flex-shrink-0 bg-stone-50 border-r border-stone-200 flex flex-col overflow-y-auto">
            <div className="px-5 py-4 bg-white border-b border-stone-100 flex-shrink-0 flex items-center justify-between">
              <div>
                <h2 className="font-serif text-slate-900 text-lg">{activeLabel}</h2>
                <p className="text-xs text-slate-400 mt-0.5">Änderungen sofort in der Vorschau sichtbar</p>
              </div>
              {!data.is_live && (
                <button onClick={handleUnlockClick} disabled={isSaving}
                  className="flex items-center gap-1.5 bg-sage-600 hover:bg-sage-500 text-white text-xs font-semibold px-3 py-2 rounded-xl transition shadow-sm disabled:opacity-50 flex-shrink-0 ml-3">
                  🔓 Freischalten (49.–)
                </button>
              )}
            </div>
            <div className="p-4 flex-1">
              <SectionEditor activeSection={activeSection} data={data} update={update}
                files={files} onImageUpload={handleImageUpload}
                onGalleryUpload={handleGalleryUpload} onGalleryRemove={removeGalleryImage}
                onGalleryCaption={updateCaption} />
            </div>
          </main>

          {/* Right: Preview */}
          <div className="flex-1 flex flex-col overflow-hidden bg-stone-300">
            <div className="h-10 bg-stone-800 flex items-center justify-between px-5 flex-shrink-0">
              <div className="flex items-center gap-1.5">
                {[0,1,2].map(i => <div key={i} className="w-2.5 h-2.5 rounded-full bg-white/10" />)}
              </div>
              <span className="text-[11px] text-stone-400 font-medium truncate">
                {(process.env.NEXT_PUBLIC_APP_URL || 'https://memorize-liart.vercel.app').replace(/^https?:\/\//, '')}/gedenken/{data.slug}
              </span>
              <div />
            </div>
            <div className="flex-1 overflow-y-auto bg-white">
              <PreviewMemorial data={data} />
            </div>
          </div>
        </div>

        {/* Fixed Save Bar */}
        <DesktopSaveBar isSaving={isSaving} isDirty={isDirty} savedAt={savedAt} onSave={handleSave}
          isLive={data.is_live} onUnlock={handleUnlockClick} slug={data.slug} />
      </div>
    </>
  );
}

// ── Section Navigation ─────────────────────────────────────────────────────────
function SectionNav({ active, onSelect }: { active: SectionId; onSelect: (id: SectionId) => void }) {
  return (
    <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto">
      {SECTIONS.map(s => {
        const Icon = s.icon;
        const isActive = s.id === active;
        return (
          <button key={s.id} onClick={() => onSelect(s.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition text-left ${isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-stone-50 hover:text-slate-900'}`}>
            <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
            <span className="flex-1 font-medium">{s.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

// ── Save Status ────────────────────────────────────────────────────────────────
function SaveStatus({ isSaving, isDirty, savedAt }: { isSaving: boolean; isDirty: boolean; savedAt: Date | null }) {
  if (isSaving) return <span className="flex items-center gap-1.5 text-xs text-slate-500"><Loader2 className="w-3 h-3 animate-spin" />Wird gespeichert…</span>;
  if (isDirty)  return <span className="flex items-center gap-1.5 text-xs text-amber-600"><div className="w-1.5 h-1.5 rounded-full bg-amber-400" />Nicht gespeicherte Änderungen</span>;
  if (savedAt)  return <span className="flex items-center gap-1.5 text-xs text-green-600"><CheckCircle2 className="w-3 h-3" />Entwurf gespeichert</span>;
  return <span className="text-xs text-slate-400">Bereit</span>;
}

// ── Save Bars ──────────────────────────────────────────────────────────────────
interface SaveBarProps { isSaving: boolean; isDirty: boolean; savedAt: Date | null; onSave: () => void; isLive: boolean; onUnlock: () => void; slug?: string; }

function DesktopSaveBar({ isSaving, isDirty, savedAt, onSave, isLive, onUnlock, slug }: SaveBarProps) {
  return (
    <div className="h-14 bg-white border-t border-stone-200 px-6 flex items-center justify-between flex-shrink-0">
      <SaveStatus isSaving={isSaving} isDirty={isDirty} savedAt={savedAt} />
      <div className="flex items-center gap-3">
        {isLive && slug && (
          <a href={`${process.env.NEXT_PUBLIC_APP_URL || ''}/gedenken/${slug}`} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition px-3 py-2 rounded-xl hover:bg-stone-50">
            <Eye className="w-4 h-4" /> Vorschau
          </a>
        )}
        {!isLive && (
          <button onClick={onUnlock} disabled={isSaving}
            className="flex items-center gap-2 bg-sage-600 hover:bg-sage-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition shadow-sm disabled:opacity-50">
            🔓 Freischalten (CHF 49.–)
          </button>
        )}
        <button onClick={onSave} disabled={isSaving}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition shadow-sm disabled:opacity-50">
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Entwurf speichern
        </button>
      </div>
    </div>
  );
}

function MobileSaveBar({ isSaving, isDirty, savedAt, onSave, isLive, onUnlock }: SaveBarProps) {
  return (
    <div className="bg-white border-t border-stone-200 px-4 py-3 flex items-center justify-between flex-shrink-0 gap-2">
      <SaveStatus isSaving={isSaving} isDirty={isDirty} savedAt={savedAt} />
      <div className="flex items-center gap-2">
        {!isLive && (
          <button onClick={onUnlock} disabled={isSaving}
            className="flex items-center gap-1.5 bg-sage-600 text-white text-xs font-semibold px-3 py-2.5 rounded-xl transition disabled:opacity-50">
            🔓 49.–
          </button>
        )}
        <button onClick={onSave} disabled={isSaving}
          className="flex items-center gap-2 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition disabled:opacity-50">
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Speichern
        </button>
      </div>
    </div>
  );
}
