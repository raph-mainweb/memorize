/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { Heart, Calendar, MapPin, Image as ImageIcon, Flame, Music, ExternalLink } from 'lucide-react';

export default function PreviewMemorial({ data }: { data: any }) {
  const fmt = (d?: string) => {
    if (!d) return null;
    try { return new Date(d).toLocaleDateString('de-CH', { day: 'numeric', month: 'long', year: 'numeric' }); } catch { return d; }
  };

  return (
    <div className="w-full bg-stone-50 min-h-full flex flex-col font-sans overflow-x-hidden">

      {/* ── Hero ── */}
      <div className="relative w-full aspect-[16/7] bg-stone-200">
        {data?.title_image
          ? <img src={data.title_image} alt="Titelbild" className="w-full h-full object-cover" />
          : <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 bg-stone-200/50">
              <ImageIcon className="w-10 h-10 mb-2 opacity-40" />
              <span className="text-xs font-medium tracking-widest uppercase">Titelbild</span>
            </div>
        }
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/70" />
      </div>

      <div className="max-w-2xl mx-auto w-full px-6 -mt-24 relative z-10 flex flex-col items-center">

        {/* Profile */}
        <div className="w-36 h-36 rounded-[2rem] bg-white p-2 shadow-2xl shadow-stone-200/50 mb-6 border border-stone-100 rotate-[-2deg]">
          <div className="w-full h-full rounded-[1.5rem] bg-stone-100 overflow-hidden">
            {data?.profile_image
              ? <img src={data.profile_image} alt={data.name} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-stone-300"><ImageIcon className="w-8 h-8 opacity-50" /></div>
            }
          </div>
        </div>

        {/* Name & Dates */}
        <div className="text-center mb-10">
          <span className="text-sage-500 font-medium tracking-widest uppercase text-xs mb-2 block">
            {data?.subtitle || 'In liebevoller Erinnerung'}
          </span>
          <h1 className="text-3xl md:text-4xl font-serif text-slate-900 mb-5 leading-tight">{data?.name || 'Name der Person'}</h1>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-slate-500 text-sm">
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Geboren</span>
              <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-sage-400" /><span>{fmt(data?.birth_date) || '–'}</span></div>
              {data?.birth_place && <div className="flex items-center gap-1 text-xs text-slate-400"><MapPin className="w-3 h-3" />{data.birth_place}</div>}
            </div>
            <Heart className="w-5 h-5 text-slate-200 fill-slate-100 hidden sm:block" />
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Gestorben</span>
              <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-sage-400" /><span>{fmt(data?.death_date) || '–'}</span></div>
              {data?.death_place && <div className="flex items-center gap-1 text-xs text-slate-400"><MapPin className="w-3 h-3" />{data.death_place}</div>}
            </div>
          </div>
        </div>

        {/* Biography */}
        {(data?.biography || true) && (
          <div className="w-full bg-white p-7 rounded-[2.5rem] shadow-sm border border-stone-100 mb-8 relative overflow-hidden">
            <h2 className="text-lg font-serif text-slate-900 mb-4">Lebensgeschichte</h2>
            {data?.biography
              ? <p className={`text-slate-600 font-light leading-loose whitespace-pre-line ${data.biography_font_size === 'sm' ? 'text-sm' : data.biography_font_size === 'lg' ? 'text-base' : 'text-sm'}`}>{data.biography}</p>
              : <p className="text-slate-400 italic text-sm">Noch keine Lebensgeschichte hinterlegt…</p>
            }
          </div>
        )}

        {/* Timeline */}
        {data?.timeline?.length > 0 && (
          <div className="w-full mb-8">
            <h2 className="text-lg font-serif text-slate-900 mb-5">Lebensstationen</h2>
            <div className="relative border-l-2 border-stone-200 ml-3 space-y-6">
              {data.timeline.map((item: any, i: number) => (
                <div key={i} className="pl-6 relative">
                  <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white border-2 border-sage-400" />
                  <span className="text-xs font-bold text-sage-600 uppercase tracking-wider">{item.year}</span>
                  <h3 className="text-sm font-semibold text-slate-800 mt-0.5">{item.title}</h3>
                  {item.location && <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{item.location}</p>}
                  {item.description && <p className="text-xs text-slate-500 mt-1 leading-relaxed">{item.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Gallery */}
        {data?.gallery?.length > 0 && (
          <div className="w-full mb-8">
            <h2 className="text-lg font-serif text-slate-900 mb-4">Erinnerungen</h2>
            <div className={data?.gallery_layout === 'slideshow' ? 'flex gap-3 overflow-x-auto pb-2' : 'columns-2 gap-3 space-y-3'}>
              {data.gallery.map((img: any, i: number) => (
                <div key={i} className={`bg-white p-1.5 rounded-2xl shadow-sm border border-stone-100 ${data?.gallery_layout === 'slideshow' ? 'flex-shrink-0 w-48' : 'break-inside-avoid'}`}>
                  <div className={`rounded-xl overflow-hidden bg-stone-100 ${data?.gallery_layout === 'slideshow' ? 'aspect-square' : 'aspect-square'}`}>
                    <img src={img.url} className="w-full h-full object-cover" alt="" />
                  </div>
                  {img.caption && <p className="text-center text-[10px] text-slate-400 mt-2 mb-1 px-2 italic">«{img.caption}»</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Music / Video */}
        {(data?.spotify_url || data?.youtube_url) && (
          <div className="w-full bg-white p-6 rounded-[2rem] border border-stone-100 shadow-sm mb-8">
            <div className="flex items-center gap-2 mb-4"><Music className="w-4 h-4 text-sage-500" /><h2 className="text-lg font-serif text-slate-900">Musik & Video</h2></div>
            {data.spotify_url && <div className="p-3 bg-stone-50 rounded-xl text-xs text-slate-500 mb-2">🎵 Spotify-Playlist eingebettet</div>}
            {data.youtube_url && <div className="p-3 bg-stone-50 rounded-xl text-xs text-slate-500">🎬 {data.video_caption || 'Video'}</div>}
          </div>
        )}

        {/* Candles */}
        {data?.candles_enabled !== false && (
          <div className="w-full bg-white p-6 rounded-[2rem] border border-stone-100 shadow-sm mb-8">
            <div className="flex items-center gap-2 mb-4"><Flame className="w-4 h-4 text-amber-400" /><h2 className="text-lg font-serif text-slate-900">Gedenkkerzen</h2></div>
            <button className="w-full py-2.5 border border-amber-200 bg-amber-50 text-amber-800 text-sm font-medium rounded-xl hover:bg-amber-100 transition">🕯️ Kerze anzünden</button>
            {data?.candles_allow_message && <p className="text-xs text-slate-400 mt-2 text-center">Mit optionaler Botschaft</p>}
          </div>
        )}

        {/* Funeral */}
        {(data?.funeral_date || data?.funeral_location) && (
          <div className="w-full bg-white p-6 rounded-[2rem] border border-stone-100 shadow-sm mb-8">
            <div className="flex items-center gap-2 mb-3"><Calendar className="w-4 h-4 text-sage-500" /><h2 className="text-lg font-serif text-slate-900">Bestattungsinfos</h2></div>
            {data.funeral_date && <p className="text-sm text-slate-600">{fmt(data.funeral_date)}{data.funeral_time ? `, ${data.funeral_time} Uhr` : ''}</p>}
            {data.funeral_location && <p className="text-sm text-slate-600">{data.funeral_location}</p>}
            {data.funeral_address && <p className="text-xs text-slate-400 mt-1">{data.funeral_address}</p>}
            {data.funeral_notes && <p className="text-xs text-slate-400 mt-2 italic">{data.funeral_notes}</p>}
          </div>
        )}

        {/* Grave */}
        {(data?.grave_cemetery || data?.grave_field) && (
          <div className="w-full bg-white p-6 rounded-[2rem] border border-stone-100 shadow-sm mb-8">
            <div className="flex items-center gap-2 mb-3"><MapPin className="w-4 h-4 text-sage-500" /><h2 className="text-lg font-serif text-slate-900">Grabstandort</h2></div>
            {data.grave_cemetery && <p className="text-sm text-slate-600">{data.grave_cemetery}</p>}
            {data.grave_field && <p className="text-xs text-slate-400">{data.grave_field}</p>}
            {data.grave_maps_url && (
              <a href={data.grave_maps_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-sage-600 hover:text-sage-700 mt-2">
                <ExternalLink className="w-3 h-3" /> In Google Maps öffnen
              </a>
            )}
          </div>
        )}

        {/* Donation */}
        {data?.donation_url && (
          <div className="w-full bg-white p-6 rounded-[2rem] border border-stone-100 shadow-sm mb-8">
            <div className="flex items-center gap-2 mb-3"><Heart className="w-4 h-4 text-rose-400" /><h2 className="text-lg font-serif text-slate-900">{data.donation_title || 'Spenden & Links'}</h2></div>
            {data.donation_description && <p className="text-xs text-slate-500 mb-3">{data.donation_description}</p>}
            <a href={data.donation_url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 transition">
              {data.donation_button_text || 'Jetzt spenden'} <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </a>
          </div>
        )}

        <div className="pb-20" />
      </div>

      <footer className="w-full bg-stone-100 py-10 mt-auto border-t border-stone-200 text-center">
        <p className="text-slate-400 font-serif text-lg tracking-tight mb-1">Nachklang <span className="text-sage-500 italic">CH</span></p>
        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">In ewiger Erinnerung</p>
      </footer>
    </div>
  );
}
