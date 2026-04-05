'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { CheckCircle2, X } from 'lucide-react';

export default function SavedToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (searchParams.get('saved') === 'true') {
      setVisible(true);

      // Clean the URL (remove ?saved=true) without a reload
      router.replace(pathname, { scroll: false });

      // Auto-dismiss after 4 seconds
      const timer = setTimeout(() => setVisible(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [searchParams, router, pathname]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900 text-white pl-4 pr-3 py-3.5 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
      <CheckCircle2 className="w-5 h-5 text-sage-400 flex-shrink-0" />
      <span className="text-sm font-medium">Produkt gespeichert</span>
      <button
        onClick={() => setVisible(false)}
        className="ml-1 text-white/60 hover:text-white transition"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
