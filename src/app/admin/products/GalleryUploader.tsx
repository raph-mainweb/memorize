'use client';

import { useState, useCallback } from 'react';
import { Upload, X, ImageIcon, Loader2 } from 'lucide-react';
import Image from 'next/image';

interface GalleryUploaderProps {
  productId?: string;
  initialImages?: string[];
  onChange: (images: string[]) => void;
}

export default function GalleryUploader({ productId, initialImages = [], onChange }: GalleryUploaderProps) {
  const [images, setImages] = useState<string[]>(initialImages);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    if (productId) formData.append('product_id', productId);

    const res = await fetch('/api/admin/products/upload-image', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload fehlgeschlagen');
    return data.url as string;
  };

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const validFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (!validFiles.length) return;

    setUploading(true);
    try {
      const urls = await Promise.all(validFiles.map(uploadFile));
      const updated = [...images, ...urls];
      setImages(updated);
      onChange(updated);
    } catch (err) {
      console.error('Gallery upload error:', err);
    } finally {
      setUploading(false);
    }
  }, [images, onChange, productId]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFiles(e.target.files);
  };

  const removeImage = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    setImages(updated);
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {images.map((src, i) => (
            <div key={i} className="relative group rounded-2xl overflow-hidden aspect-square bg-stone-100 border border-stone-200">
              <Image
                src={src}
                alt={`Produktbild ${i + 1}`}
                fill
                className="object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute top-2 right-2 w-7 h-7 bg-black/70 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              {i === 0 && (
                <div className="absolute bottom-2 left-2 text-[9px] font-bold uppercase tracking-widest bg-white/90 text-slate-700 px-2 py-0.5 rounded-full">
                  Titelbild
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Drop Zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition cursor-pointer
          ${dragOver ? 'border-sage-500 bg-sage-50' : 'border-slate-200 hover:border-slate-400 hover:bg-slate-50'}`}
      >
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleInputChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={uploading}
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-2 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p className="text-sm">Bilder werden hochgeladen...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-slate-400 pointer-events-none">
            {images.length === 0 ? (
              <ImageIcon className="w-10 h-10 opacity-50" />
            ) : (
              <Upload className="w-8 h-8 opacity-60" />
            )}
            <p className="text-sm font-medium">
              {images.length === 0 ? 'Bilder hierher ziehen oder klicken' : 'Weitere Bilder hinzufügen'}
            </p>
            <p className="text-xs">JPG, PNG, WEBP – max. 10MB pro Bild</p>
          </div>
        )}
      </div>
    </div>
  );
}
