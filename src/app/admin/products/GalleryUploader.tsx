'use client';

import { useState, useRef } from 'react';
import { X, Loader2, Plus } from 'lucide-react';
import Image from 'next/image';
import { createClient } from '@/utils/supabase/client';

interface GalleryUploaderProps {
  productId?: string;
  initialImages?: string[];
  onChange: (images: string[]) => void;
}

export default function GalleryUploader({ productId, initialImages = [], onChange }: GalleryUploaderProps) {
  const [images, setImages] = useState<string[]>(initialImages);
  const [mainIdx, setMainIdx] = useState(0);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const MAX_VISIBLE = 6; // max thumbnails shown before "+N"

  async function uploadFiles(files: File[]) {
    setUploading(true);
    const newUrls: string[] = [];

    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const path = `products/${productId || 'draft'}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error } = await supabase.storage
        .from('memorial-media')
        .upload(path, file, { contentType: file.type, upsert: false });

      if (error) {
        console.error('Upload error:', error.message);
        continue;
      }

      const { data } = supabase.storage.from('memorial-media').getPublicUrl(path);
      newUrls.push(data.publicUrl);
    }

    const updated = [...images, ...newUrls];
    setImages(updated);
    onChange(updated);
    setUploading(false);
  }

  function removeImage(idx: number) {
    const updated = images.filter((_, i) => i !== idx);
    setImages(updated);
    onChange(updated);
    if (mainIdx >= updated.length) setMainIdx(Math.max(0, updated.length - 1));
  }

  function moveToFirst(idx: number) {
    const updated = [images[idx], ...images.filter((_, i) => i !== idx)];
    setImages(updated);
    onChange(updated);
    setMainIdx(0);
  }

  const mainImage = images[mainIdx];
  const thumbnails = images.slice(0, MAX_VISIBLE);
  const hiddenCount = images.length - MAX_VISIBLE;

  return (
    <div>
      <div className="flex gap-3">
        {/* Main large image */}
        <div className="relative flex-shrink-0 w-48 h-48 bg-stone-100 border border-stone-200 rounded-2xl overflow-hidden">
          {mainImage ? (
            <>
              <Image src={mainImage} alt="Hauptbild" fill className="object-cover" />
              <button
                type="button"
                onClick={() => removeImage(mainIdx)}
                className="absolute top-2 right-2 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition"
              >
                <X className="w-3 h-3" />
              </button>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-stone-400 text-xs text-center px-4">
              Noch kein Bild
            </div>
          )}
        </div>

        {/* Thumbnail grid */}
        <div className="flex-grow grid grid-cols-3 gap-2 content-start">
          {thumbnails.map((src, i) => (
            <div
              key={i}
              className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition group ${i === mainIdx ? 'border-slate-900' : 'border-transparent'}`}
              onClick={() => setMainIdx(i)}
            >
              <Image src={src} alt={`Bild ${i + 1}`} fill className="object-cover" />
              {/* +N overlay on last visible if there are more */}
              {i === MAX_VISIBLE - 1 && hiddenCount > 0 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold text-sm">
                  +{hiddenCount}
                </div>
              )}
              <button
                type="button"
                onClick={e => { e.stopPropagation(); removeImage(i); }}
                className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition hover:bg-red-600"
              >
                <X className="w-2.5 h-2.5" />
              </button>
              {i !== 0 && (
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); moveToFirst(i); }}
                  className="absolute bottom-1 left-1 text-[8px] font-bold uppercase bg-white/80 text-slate-700 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition"
                >
                  Titelbild
                </button>
              )}
            </div>
          ))}

          {/* Add more button */}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="aspect-square rounded-xl border-2 border-dashed border-stone-300 hover:border-slate-500 flex items-center justify-center text-stone-400 hover:text-slate-600 transition"
          >
            {uploading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Plus className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={e => e.target.files && uploadFiles(Array.from(e.target.files))}
      />

      {/* Drop zone when no images */}
      {images.length === 0 && (
        <div
          onClick={() => inputRef.current?.click()}
          className="mt-3 border-2 border-dashed border-stone-300 rounded-2xl p-10 text-center cursor-pointer hover:border-slate-500 hover:bg-slate-50 transition"
        >
          {uploading ? (
            <Loader2 className="w-8 h-8 animate-spin text-slate-400 mx-auto" />
          ) : (
            <>
              <Plus className="w-10 h-10 text-stone-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-600">Bilder hierher ziehen oder klicken</p>
              <p className="text-xs text-slate-400 mt-1">JPG, PNG, WEBP · mehrere gleichzeitig</p>
            </>
          )}
        </div>
      )}

      {images.length > 0 && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="mt-3 w-full text-center text-sm text-slate-500 hover:text-slate-800 py-2 border border-dashed border-stone-200 rounded-xl hover:border-slate-400 transition"
        >
          {uploading ? 'Lädt hoch...' : '+ Weitere Bilder hinzufügen'}
        </button>
      )}
    </div>
  );
}
