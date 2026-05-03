/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { Camera, Plus, Trash2, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import type { MemorialState, SectionId, ImageFiles, TimelineItem } from './GuestBuilderClient';

interface Props {
  activeSection: SectionId;
  data: MemorialState;
  update: (patch: Partial<MemorialState>) => void;
  files: ImageFiles;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>, field: 'title_image' | 'profile_image') => void;
  onGalleryUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onGalleryRemove: (idx: number) => void;
  onGalleryCaption: (idx: number, caption: string) => void;
}

// ── Shared helpers ────────────────────────────────────────────────────────────
const ic = 'w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-sage-400 focus:border-sage-400 transition text-sm text-slate-900 outline-none';
const lc = 'block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1';
const Card = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-white rounded-2xl border border-stone-100 p-4 space-y-4">{children}</div>
);
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div><label className={lc}>{label}</label>{children}</div>
);
const Toggle = ({ label, desc, checked, onChange }: { label: string; desc?: string; checked: boolean; onChange: (v: boolean) => void }) => (
  <div className="flex items-start justify-between gap-3 py-2">
    <div><p className="text-sm font-medium text-slate-800">{label}</p>{desc && <p className="text-xs text-slate-400 mt-0.5">{desc}</p>}</div>
    <button onClick={() => onChange(!checked)}
      className={`relative w-10 h-6 rounded-full transition flex-shrink-0 ${checked ? 'bg-sage-500' : 'bg-stone-200'}`}>
      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${checked ? 'left-5' : 'left-1'}`} />
    </button>
  </div>
);
const ImageUploadBox = ({ preview, label, onUpload, wide }: { preview: string | null; label: string; onUpload: (e: any) => void; wide?: boolean }) => (
  <label className={`relative bg-stone-50 border-2 border-dashed border-stone-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-sage-400 transition group overflow-hidden ${wide ? 'w-full h-28' : 'w-20 h-20'}`}>
    {preview ? (
      <><img src={preview} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 transition" alt="" />
        <span className="relative z-10 bg-white/90 text-xs font-medium px-2 py-1 rounded-full shadow-sm text-slate-700">Ändern</span></>
    ) : (
      <><Camera className="w-5 h-5 text-stone-400 mb-1 group-hover:text-sage-500 transition" />
        <span className="text-[10px] text-stone-500 font-medium">{label}</span></>
    )}
    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/jpeg,image/png,image/webp" onChange={onUpload} />
  </label>
);

// ── Section: Titelbereich ─────────────────────────────────────────────────────
function TitleSection({ data, update, onImageUpload }: Pick<Props, 'data' | 'update' | 'onImageUpload'>) {
  const themes = [
    { id: 'sage', label: 'Grün' }, { id: 'slate', label: 'Blau' },
    { id: 'stone', label: 'Grau' }, { id: 'rose', label: 'Rose' },
  ];
  return (
    <div className="space-y-4">
      <Card>
        <Field label="Name"><input className={ic} value={data.name} onChange={e => update({ name: e.target.value })} /></Field>
        <Field label="Untertitel"><input className={ic} value={data.subtitle} onChange={e => update({ subtitle: e.target.value })} placeholder="In liebevoller Erinnerung" /></Field>
      </Card>
      <Card>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Geburtsdatum"><input type="date" className={ic} value={data.birth_date} onChange={e => update({ birth_date: e.target.value })} /></Field>
          <Field label="Geburtsort"><input className={ic} value={data.birth_place} onChange={e => update({ birth_place: e.target.value })} placeholder="z.B. Bern" /></Field>
          <Field label="Todesdatum"><input type="date" className={ic} value={data.death_date} onChange={e => update({ death_date: e.target.value })} /></Field>
          <Field label="Todesort"><input className={ic} value={data.death_place} onChange={e => update({ death_place: e.target.value })} placeholder="z.B. Zürich" /></Field>
        </div>
      </Card>
      <Card>
        <Field label="Titelbild (Hintergrund)"><ImageUploadBox preview={data.title_image} label="Hochladen" onUpload={e => onImageUpload(e, 'title_image')} wide /></Field>
        <Field label="Profilbild"><ImageUploadBox preview={data.profile_image} label="Hochladen" onUpload={e => onImageUpload(e, 'profile_image')} /></Field>
      </Card>
      <Card>
        <Field label="Farbthema">
          <div className="flex gap-2 flex-wrap">
            {themes.map(t => (
              <button key={t.id} onClick={() => update({ color_theme: t.id })}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${data.color_theme === t.id ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-600 hover:border-slate-400'}`}>
                {t.label}
              </button>
            ))}
          </div>
        </Field>
      </Card>
    </div>
  );
}

// ── Section: Lebensgeschichte ─────────────────────────────────────────────────
function BiographySection({ data, update }: Pick<Props, 'data' | 'update'>) {
  return (
    <div className="space-y-4">
      <Card>
        <Field label="Schriftgrösse">
          <div className="flex gap-2">
            {([['sm', 'Klein'], ['md', 'Mittel'], ['lg', 'Gross']] as const).map(([v, l]) => (
              <button key={v} onClick={() => update({ biography_font_size: v })}
                className={`flex-1 py-2 rounded-xl text-xs font-medium border transition ${data.biography_font_size === v ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-500 hover:border-slate-400'}`}>
                {l}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Lebensgeschichte">
          <textarea value={data.biography} onChange={e => update({ biography: e.target.value })}
            placeholder="Wie würdest du dieses Leben beschreiben?" rows={10}
            className={`${ic} resize-none leading-relaxed`} />
        </Field>
        <div className="flex items-center gap-2 p-3 bg-stone-50 rounded-xl border border-stone-100">
          <span className="text-xs text-slate-500">✨ KI-Schreibhilfe</span>
          <span className="text-[10px] text-slate-400 ml-auto">Kommt bald</span>
        </div>
      </Card>
    </div>
  );
}

// ── Section: Lebensstationen ──────────────────────────────────────────────────
function TimelineSection({ data, update }: Pick<Props, 'data' | 'update'>) {
  const add = () => update({ timeline: [...data.timeline, { id: Date.now().toString(), year: '', title: '', location: '', description: '' }] });
  const remove = (id: string) => update({ timeline: data.timeline.filter(t => t.id !== id) });
  const patch = (id: string, p: Partial<TimelineItem>) => update({ timeline: data.timeline.map(t => t.id === id ? { ...t, ...p } : t) });
  return (
    <div className="space-y-3">
      {data.timeline.map((item) => (
        <Card key={item.id}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Station</span>
            <button onClick={() => remove(item.id)} className="text-red-400 hover:text-red-600 transition"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Jahr"><input className={ic} value={item.year} onChange={e => patch(item.id, { year: e.target.value })} placeholder="z.B. 1985" /></Field>
            <Field label="Ort"><input className={ic} value={item.location} onChange={e => patch(item.id, { location: e.target.value })} placeholder="z.B. Bern" /></Field>
          </div>
          <Field label="Titel"><input className={ic} value={item.title} onChange={e => patch(item.id, { title: e.target.value })} placeholder="z.B. Schulabschluss" /></Field>
          <Field label="Beschreibung"><textarea className={`${ic} resize-none`} rows={2} value={item.description} onChange={e => patch(item.id, { description: e.target.value })} placeholder="Kurze Beschreibung…" /></Field>
        </Card>
      ))}
      <button onClick={add} className="w-full py-3 border-2 border-dashed border-stone-200 rounded-2xl text-sm text-slate-500 hover:border-sage-400 hover:text-sage-700 transition flex items-center justify-center gap-2">
        <Plus className="w-4 h-4" /> Station hinzufügen
      </button>
    </div>
  );
}

// ── Section: Bildergalerie ────────────────────────────────────────────────────
function GallerySection({ data, update, onGalleryUpload, onGalleryRemove, onGalleryCaption }: Pick<Props, 'data' | 'update' | 'onGalleryUpload' | 'onGalleryRemove' | 'onGalleryCaption'>) {
  return (
    <div className="space-y-4">
      <Card>
        <Field label="Layout">
          <div className="flex gap-2">
            {([['grid', 'Raster'], ['slideshow', 'Slideshow']] as const).map(([v, l]) => (
              <button key={v} onClick={() => update({ gallery_layout: v })}
                className={`flex-1 py-2.5 rounded-xl text-xs font-medium border transition ${data.gallery_layout === v ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-500 hover:border-slate-400'}`}>
                {l}
              </button>
            ))}
          </div>
        </Field>
      </Card>
      <Card>
        <p className={lc}>Bilder ({data.gallery.length}/20)</p>
        <div className="grid grid-cols-3 gap-2">
          {data.gallery.map((img, idx) => (
            <div key={idx} className="relative group">
              <div className="aspect-square rounded-xl overflow-hidden bg-stone-100">
                <img src={img.url} className="w-full h-full object-cover" alt="" />
              </div>
              <button onClick={() => onGalleryRemove(idx)}
                className="absolute top-1 right-1 bg-white/90 text-red-400 p-1 rounded-full opacity-0 group-hover:opacity-100 transition shadow-sm">
                <Trash2 className="w-3 h-3" />
              </button>
              <input type="text" value={img.caption} onChange={e => onGalleryCaption(idx, e.target.value)}
                placeholder="Beschriftung…" maxLength={60}
                className="mt-1 text-[10px] px-2 py-1 w-full bg-white border border-stone-200 rounded-lg outline-none focus:border-sage-300 text-slate-600" />
            </div>
          ))}
          {data.gallery.length < 20 && (
            <label className="aspect-square bg-white border-2 border-dashed border-stone-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-sage-400 transition relative">
              <Plus className="w-5 h-5 text-stone-400" />
              <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/jpeg,image/png,image/webp" onChange={onGalleryUpload} />
            </label>
          )}
        </div>
      </Card>
    </div>
  );
}

// ── Section: Musik & Video ────────────────────────────────────────────────────
function MusicSection({ data, update }: Pick<Props, 'data' | 'update'>) {
  return (
    <div className="space-y-4">
      <Card>
        <Field label="Spotify-Link (optional)"><input className={ic} value={data.spotify_url} onChange={e => update({ spotify_url: e.target.value })} placeholder="https://open.spotify.com/…" /></Field>
      </Card>
      <Card>
        <Field label="YouTube-Link (optional)"><input className={ic} value={data.youtube_url} onChange={e => update({ youtube_url: e.target.value })} placeholder="https://youtube.com/watch?v=…" /></Field>
        <Field label="Video-Beschriftung"><input className={ic} value={data.video_caption} onChange={e => update({ video_caption: e.target.value })} placeholder="z.B. Lieblingslied" /></Field>
      </Card>
      <p className="text-xs text-slate-400 px-1">Musik und Video sind optional und werden nur angezeigt, wenn ein Link hinterlegt ist.</p>
    </div>
  );
}

// ── Section: Gedenkkerzen ─────────────────────────────────────────────────────
function CandlesSection({ data, update }: Pick<Props, 'data' | 'update'>) {
  return (
    <div className="space-y-4">
      <Card>
        <Toggle label="Gedenkkerzen aktivieren" desc="Besucher können eine digitale Kerze anzünden" checked={data.candles_enabled} onChange={v => update({ candles_enabled: v })} />
        {data.candles_enabled && (
          <>
            <div className="w-full h-px bg-stone-100" />
            <Toggle label="Nachrichten erlauben" desc="Besucher können eine kurze Botschaft hinterlassen" checked={data.candles_allow_message} onChange={v => update({ candles_allow_message: v })} />
            {data.candles_allow_message && (
              <Toggle label="Nachricht erforderlich" desc="Kerze nur anzündbar mit einer Botschaft" checked={data.candles_message_required} onChange={v => update({ candles_message_required: v })} />
            )}
            <Toggle label="Beiträge moderieren" desc="Nachrichten erst nach Freigabe sichtbar" checked={data.candles_moderated} onChange={v => update({ candles_moderated: v })} />
          </>
        )}
      </Card>
      {data.candles_enabled && (
        <div className="bg-stone-50 rounded-2xl border border-stone-100 p-4">
          <p className={lc}>Beispiel-Einträge (Vorschau)</p>
          {[{ name: 'Anna M.', msg: 'In stiller Trauer — du wirst immer in unseren Herzen sein.', date: '3. Mai 2025' },
            { name: 'Familie Baumann', msg: 'Wir denken an dich.', date: '2. Mai 2025' }].map((e, i) => (
            <div key={i} className="flex gap-3 py-3 border-b border-stone-200 last:border-0">
              <div className="text-lg">🕯️</div>
              <div><p className="text-xs font-semibold text-slate-700">{e.name}</p>
                {data.candles_allow_message && <p className="text-xs text-slate-500 mt-0.5 italic">«{e.msg}»</p>}
                <p className="text-[10px] text-slate-400 mt-1">{e.date}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Section: Bestattungsinfos ─────────────────────────────────────────────────
function FuneralSection({ data, update }: Pick<Props, 'data' | 'update'>) {
  return (
    <div className="space-y-4">
      <Card>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Datum"><input type="date" className={ic} value={data.funeral_date} onChange={e => update({ funeral_date: e.target.value })} /></Field>
          <Field label="Uhrzeit"><input type="time" className={ic} value={data.funeral_time} onChange={e => update({ funeral_time: e.target.value })} /></Field>
        </div>
        <Field label="Ort (z.B. Kirche)"><input className={ic} value={data.funeral_location} onChange={e => update({ funeral_location: e.target.value })} placeholder="z.B. St. Peterskirche Zürich" /></Field>
        <Field label="Adresse"><input className={ic} value={data.funeral_address} onChange={e => update({ funeral_address: e.target.value })} placeholder="Strasse, PLZ Ort" /></Field>
        <Field label="Hinweise (optional)"><textarea className={`${ic} resize-none`} rows={3} value={data.funeral_notes} onChange={e => update({ funeral_notes: e.target.value })} placeholder="z.B. Anfahrt, Parkierung, …" /></Field>
      </Card>
    </div>
  );
}

// ── Section: Grabstandort ─────────────────────────────────────────────────────
function GraveSection({ data, update }: Pick<Props, 'data' | 'update'>) {
  return (
    <div className="space-y-4">
      <Card>
        <Field label="Friedhof"><input className={ic} value={data.grave_cemetery} onChange={e => update({ grave_cemetery: e.target.value })} placeholder="z.B. Nordfriedhof Zürich" /></Field>
        <Field label="Grabfeld / Grabnummer"><input className={ic} value={data.grave_field} onChange={e => update({ grave_field: e.target.value })} placeholder="z.B. Feld 7, Grab 42" /></Field>
        <Field label="Google Maps Link">
          <input className={ic} value={data.grave_maps_url} onChange={e => update({ grave_maps_url: e.target.value })} placeholder="https://maps.google.com/…" />
          <p className="text-[10px] text-slate-400 mt-1.5 ml-1">Rechtsklick auf Maps → «Link kopieren»</p>
        </Field>
      </Card>
    </div>
  );
}

// ── Section: Spenden & Links ──────────────────────────────────────────────────
function DonationSection({ data, update }: Pick<Props, 'data' | 'update'>) {
  return (
    <div className="space-y-4">
      <Card>
        <Field label="Link-Titel"><input className={ic} value={data.donation_title} onChange={e => update({ donation_title: e.target.value })} placeholder="z.B. Gedächtnisstiftung" /></Field>
        <Field label="URL"><input className={ic} value={data.donation_url} onChange={e => update({ donation_url: e.target.value })} placeholder="https://…" /></Field>
        <Field label="Beschreibung (optional)"><textarea className={`${ic} resize-none`} rows={2} value={data.donation_description} onChange={e => update({ donation_description: e.target.value })} placeholder="Kurze Beschreibung des Links" /></Field>
        <Field label="Button-Text"><input className={ic} value={data.donation_button_text} onChange={e => update({ donation_button_text: e.target.value })} placeholder="Jetzt spenden" /></Field>
      </Card>
    </div>
  );
}

// ── Section: QR-Medaillon ─────────────────────────────────────────────────────
function QrSection({ data }: Pick<Props, 'data'>) {
  const [copied, setCopied] = useState(false);
  const url = `${process.env.NEXT_PUBLIC_APP_URL || 'https://memorize-liart.vercel.app'}/gedenken/${data.slug}`;
  const copy = () => { navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <div className="space-y-4">
      <Card>
        <p className={lc}>Persönliche URL</p>
        <div className="flex items-center gap-2 bg-stone-50 rounded-xl px-3 py-2.5 border border-stone-200">
          <span className="text-xs text-slate-600 truncate flex-1">{url}</span>
          <button onClick={copy} className="text-slate-400 hover:text-slate-700 transition flex-shrink-0">
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </Card>
      <Card>
        <p className={lc}>QR-Code</p>
        <div className="w-32 h-32 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto border border-stone-200">
          <p className="text-[10px] text-slate-400 text-center px-2">QR-Code nach dem Speichern verfügbar</p>
        </div>
        <p className="text-xs text-slate-400 text-center">Download und physisches Medaillon nach dem Veröffentlichen möglich.</p>
      </Card>
    </div>
  );
}

// ── Section: Privatsphäre ─────────────────────────────────────────────────────
function PrivacySection({ data, update }: Pick<Props, 'data' | 'update'>) {
  return (
    <div className="space-y-4">
      <Card>
        <Field label="Sichtbarkeit">
          <div className="space-y-2">
            {([
              ['public',    '🌐 Öffentlich', 'Jeder mit dem Link kann die Seite sehen'],
              ['link_only', '🔗 Nur mit Link', 'Nicht in Suchmaschinen, aber per Link zugänglich'],
              ['password',  '🔒 Passwortgeschützt', 'Besucher brauchen ein Passwort'],
            ] as const).map(([v, l, d]) => (
              <button key={v} onClick={() => update({ visibility: v })}
                className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition ${data.visibility === v ? 'border-slate-900 bg-slate-50' : 'border-stone-200 hover:border-slate-300'}`}>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-800">{l}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{d}</p>
                </div>
                <div className={`w-4 h-4 rounded-full border-2 mt-0.5 flex-shrink-0 ${data.visibility === v ? 'border-slate-900 bg-slate-900' : 'border-stone-300'}`} />
              </button>
            ))}
          </div>
        </Field>
        {data.visibility === 'password' && (
          <Field label="Passwort">
            <input type="text" className={ic} value={data.page_password} onChange={e => update({ page_password: e.target.value })} placeholder="Passwort für Besucher" />
          </Field>
        )}
      </Card>
      <Card>
        <p className={lc}>Status</p>
        <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
          <p className="text-xs text-amber-700">Die Seite befindet sich im Entwurfsmodus. Zum Veröffentlichen bitte speichern und anschliessend im Dashboard freischalten.</p>
        </div>
      </Card>
    </div>
  );
}

// ── Main SectionEditor switch ─────────────────────────────────────────────────
export default function SectionEditor(props: Props) {
  const { activeSection, data, update, onImageUpload, onGalleryUpload, onGalleryRemove, onGalleryCaption } = props;
  switch (activeSection) {
    case 'title':     return <TitleSection data={data} update={update} onImageUpload={onImageUpload} />;
    case 'biography': return <BiographySection data={data} update={update} />;
    case 'timeline':  return <TimelineSection data={data} update={update} />;
    case 'gallery':   return <GallerySection data={data} update={update} onGalleryUpload={onGalleryUpload} onGalleryRemove={onGalleryRemove} onGalleryCaption={onGalleryCaption} />;
    case 'music':     return <MusicSection data={data} update={update} />;
    case 'candles':   return <CandlesSection data={data} update={update} />;
    case 'funeral':   return <FuneralSection data={data} update={update} />;
    case 'grave':     return <GraveSection data={data} update={update} />;
    case 'donation':  return <DonationSection data={data} update={update} />;
    case 'qr':        return <QrSection data={data} />;
    case 'privacy':   return <PrivacySection data={data} update={update} />;
    default:          return null;
  }
}
