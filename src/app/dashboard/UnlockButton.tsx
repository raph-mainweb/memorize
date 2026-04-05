'use client';

import { useState } from 'react';
import { Zap } from 'lucide-react';
import UnlockModal from './UnlockModal';

export default function UnlockButton({ memorialId }: { memorialId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full bg-slate-900 text-white py-2.5 rounded-xl text-xs font-semibold hover:bg-slate-800 transition flex items-center justify-center gap-1.5"
      >
        <Zap className="w-3.5 h-3.5" />
        Jetzt freischalten
      </button>

      {open && <UnlockModal memorialId={memorialId} onClose={() => setOpen(false)} />}
    </>
  );
}
