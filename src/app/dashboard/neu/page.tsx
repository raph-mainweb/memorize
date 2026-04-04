'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Camera, ChevronLeft, ChevronRight, Check } from 'lucide-react';

export default function MemorialCreationWizard() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    type: 'human',
    slug: '',
    biography: '',
  });

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  async function handleComplete() {
    setLoading(true);
    setError('');
    
    const finalSlug = formData.slug || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
       router.push('/auth/login');
       return;
    }

    const { data, error: dbError } = await supabase
      .from('memorial_pages')
      .insert({
         user_id: userData.user.id,
         name: formData.name,
         type: formData.type,
         slug: finalSlug,
         is_live: false
      })
      .select('slug')
      .single();

    if (dbError) {
      setError('Fehler beim Speichern. Vielleicht ist diese URL (einzigartiger Link) bereits vergeben?');
      setLoading(false);
    } else {
      router.push(`/gedenken/${data.slug}`);
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 pb-20 pt-8 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center mb-8">
          <button onClick={() => step > 1 ? prevStep() : router.push('/dashboard')} className="p-2 -ml-2 text-slate-400 hover:text-slate-900 transition">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-serif text-slate-900 ml-2">Neue Gedenkseite</h1>
          <div className="ml-auto text-sm text-slate-400 font-medium tracking-wider uppercase text-xs">Schritt {step} von 3</div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-200 h-[3px] rounded-full mb-10 overflow-hidden">
          <div 
            className="bg-sage-600 h-full transition-all duration-500 ease-out"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        <div className="glass p-6 sm:p-10 rounded-3xl animate-fade-in shadow-sm border border-slate-100">
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="animate-slide-up">
              <h2 className="text-2xl font-serif text-slate-900 mb-6">Für wen erstellen wir die Seite?</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Art des Profils</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => setFormData({...formData, type: 'human'})}
                      className={`py-4 rounded-xl border text-sm font-medium transition ${formData.type === 'human' ? 'border-sage-500 bg-sage-50 text-sage-900 shadow-sm' : 'border-slate-200 text-slate-500 hover:bg-white'}`}
                    >
                      Ein geliebter Mensch
                    </button>
                    <button 
                      onClick={() => setFormData({...formData, type: 'pet'})}
                      className={`py-4 rounded-xl border text-sm font-medium transition ${formData.type === 'pet' ? 'border-sage-500 bg-sage-50 text-sage-900 shadow-sm' : 'border-slate-200 text-slate-500 hover:bg-white'}`}
                    >
                      Ein treues Haustier
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Vollständiger Name</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="z.B. Maria Baumann"
                    className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-sage-500 focus:ring-sage-500 sm:text-base bg-white/70 py-3.5 px-4 outline-none border transition hover:bg-white" 
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-slide-up">
              <h2 className="text-2xl font-serif text-slate-900 mb-6">Der Link für das Medaillon</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Die persönliche URL</label>
                  <div className="flex bg-white/70 rounded-xl border border-slate-200 overflow-hidden shadow-sm transition hover:bg-white focus-within:border-sage-500 focus-within:ring-1 focus-within:ring-sage-500">
                    <span className="bg-stone-50 px-4 py-3.5 text-slate-400 text-sm border-r border-slate-200 whitespace-nowrap">nachklang.ch/gedenken/</span>
                    <input 
                      type="text" 
                      value={formData.slug}
                      onChange={(e) => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')})}
                      placeholder={formData.name ? formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : "maria-baumann"}
                      className="block w-full text-slate-900 sm:text-sm py-3.5 px-3 outline-none" 
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-2 ml-1">Diese Adresse wird angesteuert, sobald das QR-Medaillon gescannt wird.</p>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-slide-up">
              <h2 className="text-2xl font-serif text-slate-900 mb-6">Wähle ein Titelbild</h2>
              
              <div className="border-2 border-dashed border-slate-200 rounded-3xl p-10 flex flex-col items-center justify-center bg-stone-50/50 hover:bg-stone-50 transition cursor-pointer group">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm group-hover:scale-105 transition">
                  <Camera className="w-6 h-6 text-sage-500" />
                </div>
                <p className="text-sm font-medium text-slate-700">Foto auswählen</p>
                <p className="text-xs text-slate-400 mt-1">JPEG, PNG maximal 5MB</p>
                <p className="text-xs text-slate-400 mt-3 italic">(In dieser Version überspringen wir den Upload)</p>
              </div>
            </div>
          )}

        </div>

        {/* Floating Bottom Nav */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-stone-50/90 backdrop-blur-md border-t border-slate-200 sm:static sm:bg-transparent sm:border-0 sm:p-0 sm:mt-10 flex gap-4">
            <button 
              onClick={step === 1 ? () => router.push('/dashboard') : prevStep}
              className="flex-1 py-4 px-6 rounded-full border border-slate-200 bg-white font-medium text-slate-700 hover:bg-stone-50 transition text-sm shadow-sm"
              disabled={loading}
            >
              Zurück
            </button>
            <button 
              onClick={step === 3 ? handleComplete : nextStep}
              disabled={loading || (step === 1 && !formData.name)}
              className="flex-1 py-4 px-6 rounded-full bg-slate-900 font-medium text-white hover:bg-slate-800 transition flex justify-center items-center gap-2 disabled:opacity-50 text-sm shadow-md"
            >
              {loading ? 'Wird gespeichert...' : (step === 3 ? 'Kostenlos speichern' : 'Weiter')}
              {!loading && step < 3 && <ChevronRight className="w-4 h-4 opacity-70" />}
              {step === 3 && !loading && <Check className="w-4 h-4 opacity-70" />}
            </button>
        </div>

      </div>
    </div>
  );
}
