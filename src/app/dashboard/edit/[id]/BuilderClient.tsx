'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import PreviewMemorial from '@/components/builder/PreviewMemorial';
import { Save, ChevronLeft, Image as ImageIcon, MapPin, Calendar, AlignLeft, LayoutPanelLeft, BadgeCheck, Camera, Plus, Trash2, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function BuilderClient({ initialData }: { initialData: any }) {
  const router = useRouter();
  const supabase = createClient();
  const [memorial, setMemorial] = useState(initialData);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  // Handle generic input changes
  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setMemorial((prev: any) => ({ ...prev, [name]: value }));
  };

  // Real Image Upload Handler
  const handleImageUpload = async (e: any, field: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingField(field);

    const fileExt = file.name.split('.').pop();
    const fileName = `${memorial.id}-${field}-${Date.now()}.${fileExt}`;
    const filePath = `${field}s/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('memorial-media')
      .upload(filePath, file);

    if (uploadError) {
      alert('Fehler beim Upload: ' + uploadError.message);
      setUploadingField(null);
      return;
    }

    const { data } = supabase.storage.from('memorial-media').getPublicUrl(filePath);
    
    setMemorial((prev: any) => ({ ...prev, [field]: data.publicUrl }));
    setUploadingField(null);
  };

  // Gallery Upload Handler
  const handleGalleryUpload = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingField('gallery');

    const fileExt = file.name.split('.').pop();
    const fileName = `${memorial.id}-gallery-${Date.now()}.${fileExt}`;
    const filePath = `gallery/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('memorial-media')
      .upload(filePath, file);

    if (uploadError) {
      alert('Fehler beim Upload: ' + uploadError.message);
      setUploadingField(null);
      return;
    }

    const { data } = supabase.storage.from('memorial-media').getPublicUrl(filePath);
    
    const currentGallery = memorial.gallery || [];
    setMemorial((prev: any) => ({ 
      ...prev, 
      gallery: [...currentGallery, { url: data.publicUrl, caption: '' }] 
    }));
    setUploadingField(null);
  };

  const updateGalleryCaption = (index: number, caption: string) => {
    const newGallery = [...(memorial.gallery || [])];
    newGallery[index].caption = caption;
    setMemorial((prev: any) => ({ ...prev, gallery: newGallery }));
  };

  const removeGalleryImage = (index: number) => {
    const newGallery = [...(memorial.gallery || [])];
    newGallery.splice(index, 1);
    setMemorial((prev: any) => ({ ...prev, gallery: newGallery }));
  };

  // Save changes to DB
  const handleSave = async () => {
    setIsSaving(true);
    
    // Wir übergeben das gesamte Objekt wie es ist, da nun echte URLs existieren.
    const { error } = await supabase
      .from('memorial_pages')
      .update({
        name: memorial.name,
        slug: memorial.slug,
        type: memorial.type,
        biography: memorial.biography,
        birth_date: memorial.birth_date,
        birth_place: memorial.birth_place,
        death_date: memorial.death_date,
        death_place: memorial.death_place,
        title_image: memorial.title_image,
        profile_image: memorial.profile_image,
        gallery: memorial.gallery || []
      })
      .eq('id', memorial.id);

    setIsSaving(false);
    if (error) {
      alert('Fehler beim Speichern: ' + error.message);
    }
  };

  return (
    <div className="flex h-screen bg-stone-100 overflow-hidden font-sans">
      
      {/* LEFT SIDEBAR: Builder Controls */}
      <div className="w-full lg:w-[450xl] xl:w-[500px] flex-shrink-0 bg-white border-r border-stone-200 flex flex-col z-20 shadow-2xl lg:shadow-none h-full relative overflow-y-auto hidden lg:flex">
        
        {/* Header */}
        <div className="p-6 border-b border-stone-100 sticky top-0 bg-white/90 backdrop-blur-md z-10">
          <div className="flex items-center justify-between mb-6">
            <Link href="/dashboard" className="w-10 h-10 rounded-full border border-stone-200 flex items-center justify-center text-slate-500 hover:bg-stone-50 transition">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-stone-100 text-stone-500 ml-auto">
              Vorschau-Modus
            </div>
          </div>
          <h1 className="text-2xl font-serif text-slate-900 leading-tight">Gedenkseite bearbeiten</h1>
          <p className="text-sm text-slate-500 mt-1">Änderungen werden live in der Vorschau angezeigt.</p>
        </div>

        {/* Builder Sections Overlay */}
        <div className="p-6 flex-grow space-y-8">
          
          {/* General Section */}
          <section>
            <div className="flex items-center gap-2 mb-4 text-slate-900 font-serif">
              <LayoutPanelLeft className="w-5 h-5 text-sage-500" />
              <h2 className="text-xl">Allgemein</h2>
            </div>
            <div className="bg-stone-50 rounded-[1.5rem] p-5 border border-stone-100 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 ml-1">Name</label>
                <input 
                  type="text" name="name" value={memorial.name || ''} onChange={handleChange}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-sage-400 focus:border-sage-400 focus:bg-white transition text-sm text-slate-900" 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 ml-1">Persönliche URL (Link)</label>
                <div className="flex bg-white rounded-xl border border-slate-200 overflow-hidden focus-within:border-sage-500 focus-within:ring-1 focus-within:ring-sage-500 transition">
                    <span className="bg-stone-50 px-3 py-3 text-slate-400 text-xs border-r border-slate-100 flex items-center">nachklang.ch/gedenken/</span>
                    <input 
                      type="text" name="slug" value={memorial.slug || ''} onChange={handleChange}
                      className="w-full text-slate-900 text-sm py-3 px-3 outline-none" 
                    />
                </div>
              </div>
            </div>
          </section>

          {/* Media Section */}
          <section>
            <div className="flex items-center gap-2 mb-4 text-slate-900 font-serif">
              <ImageIcon className="w-5 h-5 text-sage-500" />
              <h2 className="text-xl">Titel & Profilbild</h2>
            </div>
            <div className="bg-stone-50 rounded-[1.5rem] p-5 border border-stone-100 space-y-5">
              
              <div className="w-full">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 ml-1">Titelbild (16:21)</label>
                <div className="relative w-full h-32 bg-white border-2 border-dashed border-stone-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-sage-400 transition group overflow-hidden">
                  {uploadingField === 'title_image' ? (
                    <Loader2 className="w-6 h-6 text-sage-500 animate-spin" />
                  ) : memorial.title_image ? (
                    <>
                      <img src={memorial.title_image} className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-30 transition" alt=""/>
                      <span className="relative z-10 bg-white/90 backdrop-blur text-xs font-medium px-3 py-1 rounded-full shadow-sm text-slate-700">Bild ändern</span>
                    </>
                  ) : (
                    <>
                      <Camera className="w-6 h-6 text-stone-400 mb-2 group-hover:text-sage-500 transition" />
                      <span className="text-xs text-stone-500 font-medium tracking-wide">Klicken zum Auswählen</span>
                    </>
                  )}
                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/jpeg,image/png,image/webp" onChange={(e) => handleImageUpload(e, 'title_image')} disabled={uploadingField !== null} />
                </div>
              </div>

              <div className="w-full">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 ml-1">Profilbild (1:1)</label>
                <div className="relative w-24 h-24 bg-white border-2 border-dashed border-stone-200 rounded-[1.5rem] flex flex-col items-center justify-center cursor-pointer hover:border-sage-400 transition group overflow-hidden">
                  {uploadingField === 'profile_image' ? (
                     <Loader2 className="w-5 h-5 text-sage-500 animate-spin" />
                  ) : memorial.profile_image ? (
                    <>
                      <img src={memorial.profile_image} className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-30 transition" alt=""/>
                      <Camera className="w-5 h-5 text-slate-700 relative z-10" />
                    </>
                  ) : (
                    <Camera className="w-6 h-6 text-stone-400 group-hover:text-sage-500 transition" />
                  )}
                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/jpeg,image/png,image/webp" onChange={(e) => handleImageUpload(e, 'profile_image')} disabled={uploadingField !== null} />
                </div>
              </div>

            </div>
          </section>

          {/* Dates & Locations */}
          <section>
            <div className="flex items-center gap-2 mb-4 text-slate-900 font-serif">
              <Calendar className="w-5 h-5 text-sage-500" />
              <h2 className="text-xl">Kerndaten</h2>
            </div>
            <div className="bg-stone-50 rounded-[1.5rem] p-5 border border-stone-100 space-y-6">
              
              <div className="space-y-3">
                 <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 ml-1 flex items-center gap-1.5"><Sparkles className="w-3 h-3 text-sage-400"/> Geburt</h3>
                 <div className="grid grid-cols-2 gap-3">
                   <input type="date" name="birth_date" value={memorial.birth_date || ''} onChange={handleChange} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-sage-400 focus:bg-white text-sm" />
                   <input type="text" name="birth_place" placeholder="Ort (z.B. Bern)" value={memorial.birth_place || ''} onChange={handleChange} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-sage-400 focus:bg-white text-sm" />
                 </div>
              </div>

              <div className="w-full h-px bg-stone-200/60"></div>

              <div className="space-y-3">
                 <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 ml-1 flex items-center gap-1.5"><BadgeCheck className="w-3 h-3 text-slate-400"/> Tod</h3>
                 <div className="grid grid-cols-2 gap-3">
                   <input type="date" name="death_date" value={memorial.death_date || ''} onChange={handleChange} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-sage-400 focus:bg-white text-sm" />
                   <input type="text" name="death_place" placeholder="Ort (z.B. Zürich)" value={memorial.death_place || ''} onChange={handleChange} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-sage-400 focus:bg-white text-sm" />
                 </div>
              </div>

            </div>
          </section>

          {/* Biography */}
          <section>
            <div className="flex items-center gap-2 mb-4 text-slate-900 font-serif">
              <AlignLeft className="w-5 h-5 text-sage-500" />
              <h2 className="text-xl">Lebensgeschichte</h2>
            </div>
            <div className="bg-stone-50 rounded-[1.5rem] p-5 border border-stone-100">
               <textarea 
                  name="biography" 
                  value={memorial.biography || ''} 
                  onChange={handleChange}
                  placeholder="Wie würdest du dieses Leben beschreiben? Welche Momente bleiben für immer in Erinnerung?"
                  rows={8}
                  className="w-full px-4 py-4 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-sage-400 focus:bg-white transition text-sm text-slate-700 leading-relaxed resize-none" 
               />
            </div>
          </section>

          {/* Gallery */}
          <section className="pb-10">
            <div className="flex items-center gap-2 mb-4 text-slate-900 font-serif">
              <ImageIcon className="w-5 h-5 text-sage-500" />
              <h2 className="text-xl">Erinnerungs-Galerie</h2>
            </div>
            <div className="bg-stone-50 rounded-[1.5rem] p-5 border border-stone-100 space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                 {memorial.gallery && memorial.gallery.map((img: any, idx: number) => (
                    <div key={idx} className="bg-white rounded-xl p-2 border border-stone-200 flex flex-col shadow-sm relative group">
                       <button onClick={() => removeGalleryImage(idx)} className="absolute top-3 right-3 bg-white/90 backdrop-blur text-red-500 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition shadow-sm z-10 hover:bg-red-50">
                         <Trash2 className="w-3.5 h-3.5" />
                       </button>
                       <div className="aspect-square rounded-lg bg-stone-100 overflow-hidden mb-2">
                          <img src={img.url} className="w-full h-full object-cover" alt="" />
                       </div>
                       <input 
                         type="text" 
                         value={img.caption || ''} 
                         onChange={(e) => updateGalleryCaption(idx, e.target.value)}
                         placeholder="Kurze Beschreibung..."
                         maxLength={60}
                         className="text-xs px-2 py-1.5 w-full bg-stone-50 border border-transparent focus:border-sage-200 rounded outline-none transition text-slate-600"
                       />
                    </div>
                 ))}
                 
                 <div className="aspect-square bg-white border-2 border-dashed border-stone-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-sage-400 transition relative">
                    {uploadingField === 'gallery' ? (
                       <Loader2 className="w-5 h-5 text-sage-500 animate-spin" />
                    ) : (
                       <>
                         <Plus className="w-6 h-6 text-stone-400 mb-1" />
                         <span className="text-xs text-stone-500 font-medium tracking-wide">Bild hinzufügen</span>
                       </>
                    )}
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/jpeg,image/png,image/webp" onChange={handleGalleryUpload} disabled={uploadingField !== null} />
                 </div>
              </div>

            </div>
          </section>

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-white sticky bottom-0 z-10 flex gap-3">
          <button onClick={handleSave} disabled={isSaving} className="flex-1 bg-slate-900 text-white rounded-xl py-3.5 flex items-center justify-center gap-2 font-medium text-sm hover:bg-slate-800 transition shadow-md disabled:opacity-50">
             <Save className="w-4 h-4" />
             {isSaving ? 'Speichert...' : 'Entwurf speichern'}
          </button>
        </div>
      </div>

      {/* RIGHT PREVIEW: Active rendered component */}
      <div className="flex-1 bg-stone-300 relative lg:overflow-y-auto">
        <div className="absolute inset-0 flex flex-col">
           {/* Top bar mimicking a browser/device */}
           <div className="h-14 bg-stone-800 flex items-center justify-between px-6 flex-shrink-0 z-20">
              <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full bg-red-400/20"></div>
                 <div className="w-3 h-3 rounded-full bg-yellow-400/20"></div>
                 <div className="w-3 h-3 rounded-full bg-green-400/20"></div>
              </div>
              <div className="bg-stone-700/50 rounded-full px-4 py-1 text-xs text-stone-400 font-medium tracking-wide flex items-center gap-2">
                 <span>nachklang.ch/gedenken/{memorial.slug}</span>
              </div>
              {!memorial.is_live && (
                <button className="bg-sage-600 hover:bg-sage-500 text-white text-xs px-4 py-1.5 rounded-full font-medium shadow-md transition whitespace-nowrap">
                  Freischalten & Veröffentlichen (49.-)
                </button>
              )}
           </div>

           {/* The actual preview scroll container */}
           <div className="flex-1 overflow-y-auto relative w-full h-full flex justify-center selection:bg-sage-200 hidden-scrollbar">
              <div className="w-full h-full bg-white max-w-[600px] xl:max-w-none shadow-2xl relative">
                  {/* Wir nutzen eine skalierte Vorschau oder direkt 1:1. 1:1 ist oft schöner für den Desktop-Preview */}
                  <PreviewMemorial data={memorial} />
              </div>
           </div>
        </div>
      </div>

      {/* Mobile Notice (Builder is desktop-centric for now) */}
      <div className="fixed inset-0 z-50 bg-stone-50 flex lg:hidden flex-col items-center justify-center p-8 text-center">
         <LayoutPanelLeft className="w-12 h-12 text-slate-300 mb-4" />
         <h2 className="text-xl font-serif text-slate-900 mb-2">Bitte Laptop nutzen</h2>
         <p className="text-slate-500 text-sm leading-relaxed max-w-sm">
           Der Page Builder ist für grössere Bildschirme optimiert, damit du die Gedenkseite parallel zur Bearbeitung im Detail sehen kannst.
         </p>
         <Link href="/dashboard" className="mt-8 px-6 py-3 bg-slate-900 text-white rounded-full text-sm font-medium">Zurück zur Übersicht</Link>
      </div>

    </div>
  );
}
