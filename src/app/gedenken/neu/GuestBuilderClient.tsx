/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import AuthModal from './AuthModal';
import SectionEditor from './SectionEditor';
import PreviewMemorial from '@/components/builder/PreviewMemorial';
import {
  Save, ChevronLeft, Loader2, Sparkles, ArrowRight, ExternalLink,
  Eye, CheckCircle2, User, AlignLeft, MapPin, Image as ImageIcon,
  Music, Flame, Calendar, Globe, Heart, QrCode, Lock,
} from 'lucide-react';

const WP_URL = process.env.NEXT_PUBLIC_WP_URL || 'https://memorize.mainwebsite.ch';

// ── Types ─────────────────────────────────────────────────────────────────────
export type SectionId =
  'title' | 'biography' | 'timeline' | 'gallery' |
  'music' | 'candles' | 'funeral' | 'grave' | 'donation' | 'qr' | 'privacy';

export interface TimelineItem { id: string; year: string; title: string; location: string; description: string; }
export interface GalleryImage { url: string; caption: string; }

export interface MemorialState {
  name: string; type: 'human' | 'pet'; slug: string;
  subtitle: string;
  birth_date: string; birth_place: string; death_date: string; death_place: string;
  title_image: string | null; profile_image: string | null; color_theme: string;
  biography: string; biography_font_size: 'sm' | 'md' | 'lg';
  timeline: TimelineItem[];
  gallery: GalleryImage[]; gallery_layout: 'grid' | 'slideshow';
  spotify_url: string; youtube_url: string; video_caption: string;
  candles_enabled: boolean; candles_allow_message: boolean;
  candles_message_required: boolean; candles_moderated: boolean;
  funeral_date: string; funeral_time: string; funeral_location: string;
  funeral_address: string; funeral_notes: string;
  grave_cemetery: string; grave_field: string; grave_maps_url: string;
  donation_url: string; donation_title: string;
  donation_description: string; donation_button_text: string;
  visibility: 'public' | 'link_only' | 'password';
  page_password: string; is_live: boolean;
}

export interface ImageFiles { title_image: File | null; profile_image: File | null; gallery: File[]; }

const INITIAL: MemorialState = {
  name: '', type: 'human', slug: '',
  subtitle: 'In liebevoller Erinnerung',
  birth_date: '', birth_place: '', death_date: '', death_place: '',
  title_image: null, profile_image: null, color_theme: 'sage',
  biography: '', biography_font_size: 'md',
  timeline: [],
  gallery: [], gallery_layout: 'grid',
  spotify_url: '', youtube_url: '', video_caption: '',
  candles_enabled: true, candles_allow_message: true,
  candles_message_required: false, candles_moderated: false,
  funeral_date: '', funeral_time: '', funeral_location: '',
  funeral_address: '', funeral_notes: '',
  grave_cemetery: '', grave_field: '', grave_maps_url: '',
  donation_url: '', donation_title: '', donation_description: '',
  donation_button_text: 'Jetzt spenden',
  visibility: 'public', page_password: '', is_live: false,
};

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

// ── Input helper ──────────────────────────────────────────────────────────────
const inputCls = 'w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-sage-400 focus:border-sage-400 transition text-sm text-slate-900 outline-none';

// ── Main Component ────────────────────────────────────────────────────────────
export default function GuestBuilderClient() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep]                 = useState<'wizard' | 'builder'>('wizard');
  const [activeSection, setActiveSection] = useState<SectionId>('title');
  const [mobileTab, setMobileTab]       = useState<'nav' | 'editor' | 'preview'>('editor');
  const [data, setData]                 = useState<MemorialState>(INITIAL);
  const [files, setFiles]               = useState<ImageFiles>({ title_image: null, profile_image: null, gallery: [] });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSaving, setIsSaving]         = useState(false);
  const [isDirty, setIsDirty]           = useState(false);
  const [savedAt, setSavedAt]           = useState<Date | null>(null);

  // ── State helpers ──────────────────────────────────────────────────────────
  const update = useCallback((patch: Partial<MemorialState>) => {
    setData(p => ({ ...p, ...patch }));
    setIsDirty(true);
  }, []);

  // ── Google OAuth: State nach Redirect wiederherstellen ────────────────────
  useEffect(() => {
    const restoreAfterOAuth = async () => {
      const saved = sessionStorage.getItem('nachklang_guest_draft');
      if (!saved) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      // User ist eingeloggt + gespeicherter Entwurf vorhanden → wiederherstellen
      try {
        const restored = JSON.parse(saved) as MemorialState;
        sessionStorage.removeItem('nachklang_guest_draft');
        setData(restored);
        setStep('builder');
        // Kurz warten damit State gesetzt ist, dann direkt persistieren
        setTimeout(() => persistToDb(user.id), 300);
      } catch {
        sessionStorage.removeItem('nachklang_guest_draft');
      }
    };
    restoreAfterOAuth();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'title_image' | 'profile_image') => {
    const file = e.target.files?.[0]; if (!file) return;
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

  // ── Wizard ─────────────────────────────────────────────────────────────────
  const handleWizardNext = () => {
    if (!data.name.trim()) return;
    const base = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'gedenkseite';
    update({ slug: `${base}-${Math.floor(Date.now() / 1000).toString(36)}` });
    setStep('builder');
  };

  // ── Persist to DB (after auth) ─────────────────────────────────────────────
  const persistToDb = useCallback(async (userId: string) => {
    setIsSaving(true);
    setShowAuthModal(false);

    const upload = async (file: File, folder: string, name: string): Promise<string | null> => {
      const ext = file.name.split('.').pop();
      const path = `${folder}/${userId}-${name}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('memorial-media').upload(path, file);
      if (error) return null;
      return supabase.storage.from('memorial-media').getPublicUrl(path).data.publicUrl;
    };

    const titleUrl   = files.title_image   ? await upload(files.title_image,   'title_images',   'title')   : null;
    const profileUrl = files.profile_image ? await upload(files.profile_image, 'profile_images', 'profile') : null;
    const galleryRows: GalleryImage[] = [];
    for (let i = 0; i < files.gallery.length; i++) {
      const url = await upload(files.gallery[i], 'gallery', `g${i}`);
      if (url) galleryRows.push({ url, caption: data.gallery[i]?.caption || '' });
    }

    // TODO: Add DB columns for new fields (subtitle, color_theme, biography_font_size,
    // timeline, gallery_layout, spotify_url, youtube_url, video_caption,
    // candles_*, funeral_*, grave_*, donation_*, visibility, page_password).
    // Until then, all new data is stored in the `meta` JSONB column.
    const meta = {
      subtitle: data.subtitle, color_theme: data.color_theme,
      biography_font_size: data.biography_font_size,
      timeline: data.timeline, gallery_layout: data.gallery_layout,
      spotify_url: data.spotify_url, youtube_url: data.youtube_url,
      video_caption: data.video_caption,
      candles_enabled: data.candles_enabled, candles_allow_message: data.candles_allow_message,
      candles_message_required: data.candles_message_required, candles_moderated: data.candles_moderated,
      funeral_date: data.funeral_date, funeral_time: data.funeral_time,
      funeral_location: data.funeral_location, funeral_address: data.funeral_address,
      funeral_notes: data.funeral_notes,
      grave_cemetery: data.grave_cemetery, grave_field: data.grave_field,
      grave_maps_url: data.grave_maps_url,
      donation_url: data.donation_url, donation_title: data.donation_title,
      donation_description: data.donation_description, donation_button_text: data.donation_button_text,
      visibility: data.visibility, page_password: data.page_password,
    };

    const { data: row, error } = await supabase
      .from('memorial_pages')
      .insert({
        user_id: userId, name: data.name, type: data.type, slug: data.slug,
        is_live: false, biography: data.biography || null,
        birth_date: data.birth_date || null, birth_place: data.birth_place || null,
        death_date: data.death_date || null, death_place: data.death_place || null,
        title_image: titleUrl, profile_image: profileUrl,
        gallery: galleryRows, meta,
      })
      .select('id').single();

    setIsSaving(false);
    if (error || !row) { alert('Fehler beim Speichern: ' + error?.message); return; }
    setIsDirty(false);
    setSavedAt(new Date());
    router.push('/dashboard');
  }, [data, files, supabase, router]);

  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setShowAuthModal(true); return; }
    await persistToDb(user.id);
  };

  // ── WIZARD VIEW ────────────────────────────────────────────────────────────
  if (step === 'wizard') return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <a href={WP_URL} className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-700 transition mb-10">
          <ChevronLeft className="w-4 h-4" /> Zurück zu nachklang.ch
        </a>
        <div className="bg-white rounded-[2.5rem] p-8 sm:p-10 shadow-xl border border-white relative overflow-hidden">
          <div className="absolute top-[-20%] right-[-10%] w-[250px] h-[250px] rounded-full bg-sage-100/40 blur-[80px] -z-10" />
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-stone-50 border border-stone-100 flex items-center justify-center mx-auto mb-5">
              <Sparkles className="w-7 h-7 text-sage-600" />
            </div>
            <h1 className="text-2xl font-serif text-slate-900 mb-2">Gedenkseite erstellen</h1>
            <p className="text-slate-500 font-light text-sm">Kostenlos starten — kein Konto nötig.</p>
          </div>
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2 ml-1">Um wen geht es?</label>
              <div className="grid grid-cols-2 gap-3">
                {(['human', 'pet'] as const).map(t => (
                  <button key={t} onClick={() => update({ type: t })}
                    className={`py-3.5 rounded-2xl border text-sm font-medium transition-all ${data.type === t ? 'border-sage-500 bg-sage-50 text-sage-900 shadow-inner' : 'border-slate-200 text-slate-500 hover:bg-stone-50'}`}>
                    {t === 'human' ? 'Mensch' : 'Haustier'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2 ml-1">Vollständiger Name</label>
              <input type="text" value={data.name} placeholder="z.B. Maria Baumann" autoFocus
                onChange={e => update({ name: e.target.value })}
                onKeyDown={e => e.key === 'Enter' && handleWizardNext()}
                className={inputCls} />
            </div>
            <button onClick={handleWizardNext} disabled={!data.name.trim()}
              className="w-full py-4 rounded-2xl bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 transition flex items-center justify-center gap-2 disabled:opacity-40 shadow-lg">
              Zur Gedenkseite <ArrowRight className="w-4 h-4 opacity-70" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // ── BUILDER VIEW ───────────────────────────────────────────────────────────
  const activeLabel = SECTIONS.find(s => s.id === activeSection)?.label ?? '';

  return (
    <>
      {showAuthModal && (
        <AuthModal
          guestData={data}
          onSuccess={() => supabase.auth.getUser().then(({ data: { user } }) => user && persistToDb(user.id))}
          onClose={() => setShowAuthModal(false)}
        />
      )}

      {/* ── Mobile notice ── */}
      <div className="fixed inset-0 z-[60] bg-stone-50 lg:hidden flex flex-col">
        {/* Mobile Tab Bar */}
        <div className="flex border-b border-stone-200 bg-white flex-shrink-0">
          {(['nav', 'editor', 'preview'] as const).map(tab => (
            <button key={tab} onClick={() => setMobileTab(tab)}
              className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition ${mobileTab === tab ? 'text-slate-900 border-b-2 border-slate-900' : 'text-slate-400'}`}>
              {tab === 'nav' ? 'Inhalte' : tab === 'editor' ? activeLabel : 'Vorschau'}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto">
          {mobileTab === 'nav' && <SectionNav active={activeSection} onSelect={(id) => { setActiveSection(id); setMobileTab('editor'); }} />}
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
        <MobileSaveBar isSaving={isSaving} isDirty={isDirty} savedAt={savedAt} onSave={handleSave} />
      </div>

      {/* ── Desktop 3-column layout ── */}
      <div className="hidden lg:flex h-screen flex-col bg-stone-100">
        <div className="flex flex-1 overflow-hidden">

          {/* Left: Section Nav */}
          <aside className="w-56 xl:w-64 bg-white border-r border-stone-100 flex flex-col flex-shrink-0 overflow-y-auto">
            <div className="px-4 py-5 border-b border-stone-100 flex-shrink-0">
              <span className="font-serif text-base text-slate-900">Gedenkseite gestalten</span>
              <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wider">Inhalte</p>
            </div>
            <SectionNav active={activeSection} onSelect={setActiveSection} />
            <div className="mt-auto p-4 border-t border-stone-100">
              <a href={WP_URL}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition">
                <ExternalLink className="w-3 h-3" /> Zurück zu nachklang.ch
              </a>
            </div>
          </aside>

          {/* Middle: Editor */}
          <main className="w-[400px] xl:w-[460px] flex-shrink-0 bg-stone-50 border-r border-stone-200 flex flex-col overflow-y-auto">
            {/* Editor Header */}
            <div className="px-5 py-4 bg-white border-b border-stone-100 flex-shrink-0 flex items-center justify-between">
              <div>
                <h2 className="font-serif text-slate-900 text-lg">{activeLabel}</h2>
                <p className="text-xs text-slate-400 mt-0.5">Änderungen werden sofort in der Vorschau angezeigt</p>
              </div>
              <div className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100 flex-shrink-0">
                Gast
              </div>
            </div>
            {/* Save reminder */}
            <div className="mx-4 mt-3 mb-1 flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 flex-shrink-0">
              <Save className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0" />
              <p className="text-[10px] text-amber-700 leading-snug">
                Eingaben werden nach dem Anmelden dauerhaft gespeichert — Fenster offen lassen.
              </p>
            </div>
            {/* Section form */}
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
              <span className="text-[11px] text-stone-400 font-medium">Live-Vorschau</span>
              <div />
            </div>
            <div className="flex-1 overflow-y-auto bg-white">
              <PreviewMemorial data={data} />
            </div>
          </div>
        </div>

        {/* Fixed Save Bar */}
        <DesktopSaveBar isSaving={isSaving} isDirty={isDirty} savedAt={savedAt} onSave={handleSave} />
      </div>
    </>
  );
}

// ── Section Navigation ─────────────────────────────────────────────────────────
function SectionNav({ active, onSelect }: { active: SectionId; onSelect: (id: SectionId) => void }) {
  return (
    <nav className="flex-1 py-2 px-2 space-y-0.5">
      {SECTIONS.map(s => {
        const Icon = s.icon;
        const isActive = s.id === active;
        return (
          <button key={s.id} onClick={() => onSelect(s.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition group text-left ${isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-stone-50 hover:text-slate-900'}`}>
            <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`} />
            <span className="flex-1 font-medium">{s.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

// ── Save Bars ──────────────────────────────────────────────────────────────────
function SaveStatus({ isSaving, isDirty, savedAt }: { isSaving: boolean; isDirty: boolean; savedAt: Date | null }) {
  if (isSaving) return <span className="flex items-center gap-1.5 text-xs text-slate-500"><Loader2 className="w-3 h-3 animate-spin" />Wird gespeichert…</span>;
  if (isDirty)  return <span className="flex items-center gap-1.5 text-xs text-amber-600"><div className="w-1.5 h-1.5 rounded-full bg-amber-400" />Nicht gespeicherte Änderungen</span>;
  if (savedAt)  return <span className="flex items-center gap-1.5 text-xs text-green-600"><CheckCircle2 className="w-3 h-3" />Gespeichert</span>;
  return <span className="text-xs text-slate-400">Noch nicht gespeichert</span>;
}

function DesktopSaveBar({ isSaving, isDirty, savedAt, onSave }: { isSaving: boolean; isDirty: boolean; savedAt: Date | null; onSave: () => void }) {
  return (
    <div className="h-14 bg-white border-t border-stone-200 px-6 flex items-center justify-between flex-shrink-0">
      <SaveStatus isSaving={isSaving} isDirty={isDirty} savedAt={savedAt} />
      <div className="flex items-center gap-3">
        <button className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition px-3 py-2 rounded-xl hover:bg-stone-50">
          <Eye className="w-4 h-4" /> Vorschau öffnen
        </button>
        <button onClick={onSave} disabled={isSaving}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition shadow-sm disabled:opacity-50">
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Entwurf speichern
        </button>
      </div>
    </div>
  );
}

function MobileSaveBar({ isSaving, isDirty, savedAt, onSave }: { isSaving: boolean; isDirty: boolean; savedAt: Date | null; onSave: () => void }) {
  return (
    <div className="bg-white border-t border-stone-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
      <SaveStatus isSaving={isSaving} isDirty={isDirty} savedAt={savedAt} />
      <button onClick={onSave} disabled={isSaving}
        className="flex items-center gap-2 bg-slate-900 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition disabled:opacity-50">
        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Speichern
      </button>
    </div>
  );
}
