'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { ChevronLeft, ArrowRight, Heart, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function MemorialCreationWizard() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    type: 'human'
  });

  async function handleCreate() {
    if (!formData.name.trim()) return;
    
    setLoading(true);
    setError('');
    
    // Generate base slug from name
    let baseSlug = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    if (!baseSlug) baseSlug = 'gedenkseite';
    let finalSlug = baseSlug;

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
       router.push('/auth/login');
       return;
    }

    // Try to insert. If slug exists, append random numbers and retry.
    // In a real app we'd do a select to find collisions, but for now we'll do a simple retry approach 
    // or just append timestamp to be very safe and simple. Let's use timestamp to guarantee uniqueness
    // since the user can edit it later in the builder if they want.
    finalSlug = `${baseSlug}-${Math.floor(Date.now() / 1000).toString(36)}`;

    const { data, error: dbError } = await supabase
      .from('memorial_pages')
      .insert({
         user_id: userData.user.id,
         name: formData.name.trim(),
         type: formData.type,
         slug: finalSlug,
         is_live: false,
         gallery: []
      })
      .select('id')
      .single();

    if (dbError) {
      console.error(dbError);
      setError('Ein Fehler ist bei der Erstellung aufgetreten. Bitte versuche es erneut.');
      setLoading(false);
    } else {
      // Redirect directly to the builder
      router.push(`/dashboard/edit/${data.id}`);
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 pb-20 pt-8 px-4 sm:px-6 flex flex-col">
      <div className="max-w-xl mx-auto w-full flex-grow flex flex-col justify-center">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-10 w-full">
            <Link href="/dashboard" className="inline-flex items-center text-slate-500 hover:text-slate-900 transition gap-2">
              <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                <ChevronLeft className="w-5 h-5" />
              </div>
              <span className="font-medium text-sm">Zurück zur Übersicht</span>
            </Link>
        </div>

        <div className="bg-white/80 backdrop-blur-xl p-8 sm:p-12 rounded-[2.5rem] shadow-xl shadow-stone-200/50 border border-white relative overflow-hidden">
          {/* Decorative glowing orb */}
          <div className="absolute top-[-20%] right-[-10%] w-[300px] h-[300px] rounded-full bg-sage-100/50 blur-[80px] -z-10" />

          {error && (
            <div className="mb-8 p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
              {error}
            </div>
          )}

          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-stone-50 border border-stone-100 mb-6 shadow-sm">
              <Sparkles className="w-8 h-8 text-sage-600" />
            </div>
            <h1 className="text-3xl font-serif text-slate-900 mb-3">Neues Andenken</h1>
            <p className="text-slate-500 font-light">Wir erstellen jetzt die Grundlagen. Du kannst später im Builder in Ruhe alle Bilder und Texte hinzufügen.</p>
          </div>

          <div className="space-y-8">
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-3 ml-1">Um wen geht es?</label>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setFormData({...formData, type: 'human'})}
                  className={`py-4 rounded-2xl border text-sm font-medium transition-all ${formData.type === 'human' ? 'border-sage-500 bg-sage-50 text-sage-900 shadow-inner' : 'border-slate-200 text-slate-500 hover:bg-stone-50'}`}
                >
                  Mensch
                </button>
                <button 
                  onClick={() => setFormData({...formData, type: 'pet'})}
                  className={`py-4 rounded-2xl border text-sm font-medium transition-all ${formData.type === 'pet' ? 'border-sage-500 bg-sage-50 text-sage-900 shadow-inner' : 'border-slate-200 text-slate-500 hover:bg-stone-50'}`}
                >
                  Haustier
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-3 ml-1">Vollständiger Name</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="z.B. Maria Baumann"
                className="w-full px-5 py-4 bg-stone-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-sage-400 focus:border-sage-400 focus:bg-white transition text-slate-900 font-medium sm:text-lg placeholder:text-slate-400 placeholder:font-normal" 
                autoFocus
              />
            </div>
            
            <button 
              onClick={handleCreate}
              disabled={loading || !formData.name.trim()}
              className="w-full py-4 px-6 mt-4 rounded-2xl bg-slate-900 font-bold text-white hover:bg-slate-800 transition-all flex justify-center items-center gap-3 disabled:opacity-50 text-base shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              {loading ? 'Seite wird generiert...' : 'Zum Page Builder'}
              {!loading && <ArrowRight className="w-5 h-5 opacity-70" />}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
