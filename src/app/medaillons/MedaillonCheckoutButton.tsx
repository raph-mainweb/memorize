'use client';

import { useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import MemorialPickerModal from './MemorialPickerModal';

interface Props {
  productId: string;
  productTitle: string;
}

export default function MedaillonCheckoutButton({ productId, productTitle }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex-1 flex items-center justify-center gap-2 bg-slate-900 text-white py-3.5 rounded-xl text-sm font-semibold hover:bg-slate-800 transition shadow-sm"
      >
        <ShoppingBag className="w-4 h-4" />
        Medaillon bestellen
      </button>

      {open && (
        <MemorialPickerModal
          productId={productId}
          productTitle={productTitle}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
