/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { Heart, Calendar, MapPin, Image as ImageIcon } from 'lucide-react';

export default function PreviewMemorial({ data }: { data: any }) {
  
  // Format dates helper
  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    try {
      return new Date(dateString).toLocaleDateString('de-CH', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="w-full bg-stone-50 min-h-full flex flex-col font-sans relative overflow-x-hidden">
      
      {/* Title Image (16:21 aspect ratio container natively, but usually header is standard) 
          Wait, user specified 16:21 for the title image. That's a portrait format, heavily used in mobile. 
          Let's make a beautiful hero section with this image. */}
      <div className="relative w-full aspect-[16/21] md:aspect-video bg-stone-200">
        {data?.title_image ? (
          <img 
            src={data.title_image} 
            alt="Titelbild" 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 bg-stone-200/50">
            <ImageIcon className="w-12 h-12 mb-3 opacity-50" />
            <span className="text-sm font-medium tracking-widest uppercase">Titelbild (16:21)</span>
          </div>
        )}
        
        {/* Soft bottom gradient for blending into content */}
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-stone-50 to-transparent"></div>
      </div>

      <div className="max-w-2xl mx-auto w-full px-6 -mt-32 relative z-10 flex flex-col items-center">
        
        {/* Profile Image (1:1) */}
        <div className="w-40 h-40 md:w-48 md:h-48 rounded-[2rem] bg-white p-2 shadow-2xl shadow-stone-200/50 mb-8 border border-stone-100 transform rotate-[-2deg]">
          <div className="w-full h-full rounded-[1.5rem] bg-stone-100 overflow-hidden relative">
            {data?.profile_image ? (
              <img 
                src={data.profile_image} 
                alt={data.name || 'Profilbild'} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-stone-300">
                <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                <span className="text-[10px] font-medium tracking-widest uppercase">Profil (1:1)</span>
              </div>
            )}
          </div>
        </div>

        {/* Name & Type */}
        <div className="text-center mb-12">
          {data?.type && (
            <span className="text-sage-500 font-medium tracking-widest uppercase text-xs mb-3 block">
              In liebevoller Erinnerung {data.type === 'pet' ? 'an unseren Gefährten' : ''}
            </span>
          )}
          <h1 className="text-4xl md:text-5xl font-serif text-slate-900 mb-6 leading-tight">
            {data?.name || 'Name der Person'}
          </h1>

          {/* Core Dates */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12 text-slate-500 font-light text-sm">
            
            {/* Birth */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Geboren</span>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-sage-400" />
                <span>{formatDate(data?.birth_date) || '--'}</span>
              </div>
              {(data?.birth_place) && (
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                  <MapPin className="w-3 h-3" />
                  <span>{data.birth_place}</span>
                </div>
              )}
            </div>

            {/* Separator / Infinity Heart */}
            <div className="hidden sm:flex text-slate-300">
              <Heart className="w-6 h-6 fill-slate-100" />
            </div>

            {/* Death */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Gestorben</span>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-sage-400" />
                <span>{formatDate(data?.death_date) || '--'}</span>
              </div>
              {(data?.death_place) && (
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                  <MapPin className="w-3 h-3" />
                  <span>{data.death_place}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Biography */}
        <div className="w-full bg-white p-8 md:p-12 rounded-[2.5rem] shadow-sm border border-stone-100 mb-12 relative overflow-hidden">
          <Heart className="w-16 h-16 absolute top-4 right-4 text-stone-50/50" />
          <h2 className="text-xl font-serif text-slate-900 mb-6">Lebensgeschichte</h2>
          {data?.biography ? (
            <div className="prose prose-slate prose-p:font-light prose-p:leading-relaxed text-slate-600 w-full max-w-none whitespace-pre-wrap">
              {data.biography}
            </div>
          ) : (
            <p className="text-slate-400 italic font-light text-sm">Noch keine Lebensgeschichte hinterlegt...</p>
          )}
        </div>

        {/* Gallery */}
        <div className="w-full mb-20">
          <h2 className="text-xl font-serif text-slate-900 mb-6 text-center">Erinnerungen</h2>
          
          {data?.gallery && data.gallery.length > 0 ? (
            <div className="columns-2 sm:columns-3 gap-4 space-y-4">
              {data.gallery.map((img: any, idx: number) => (
                <div key={idx} className="bg-white p-2 rounded-2xl shadow-sm border border-stone-100 break-inside-avoid">
                  <div className="rounded-xl overflow-hidden bg-stone-100 aspect-square relative">
                    <img src={img.url} className="w-full h-full object-cover" alt="" />
                  </div>
                  {img.caption && (
                    <p className="text-center text-xs text-slate-500 mt-3 mb-2 px-2 font-medium italic">
                      &quot;{img.caption}&quot;
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
             <div className="w-full border-2 border-dashed border-stone-200 rounded-[2rem] p-12 flex flex-col items-center justify-center text-stone-400">
               <ImageIcon className="w-8 h-8 mb-3 opacity-50" />
               <p className="text-sm font-light">Die Bildergalerie ist noch leer.</p>
             </div>
          )}
        </div>

      </div>

      <footer className="w-full bg-stone-100 py-12 mt-auto border-t border-stone-200 text-center">
        <p className="text-slate-400 font-serif text-xl tracking-tight mb-2">Nachklang <span className="text-sage-500 italic">CH</span></p>
        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">In ewiger Erinnerung</p>
      </footer>
    </div>
  );
}
