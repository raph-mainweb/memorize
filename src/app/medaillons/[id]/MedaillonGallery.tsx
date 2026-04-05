'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Package } from 'lucide-react';

interface Props {
  images: string[];
  title: string;
}

export default function MedaillonGallery({ images, title }: Props) {
  const [selected, setSelected] = useState(0);

  if (images.length === 0) {
    return (
      <div className="aspect-square rounded-3xl bg-stone-100 border border-stone-200 flex items-center justify-center">
        <Package className="w-20 h-20 text-stone-300" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Main Image */}
      <div className="relative aspect-square rounded-3xl overflow-hidden bg-stone-100 border border-stone-100 shadow-sm">
        <Image
          src={images[selected]}
          alt={`${title} – Bild ${selected + 1}`}
          fill
          className="object-cover transition-opacity duration-200"
          priority
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {images.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSelected(i)}
              className={`relative aspect-square rounded-xl overflow-hidden border-2 transition ${
                i === selected ? 'border-slate-900 opacity-100' : 'border-transparent opacity-60 hover:opacity-90'
              }`}
            >
              <Image src={src} alt={`Thumbnail ${i + 1}`} fill className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
