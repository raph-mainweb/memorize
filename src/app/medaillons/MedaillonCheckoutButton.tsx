'use client';

import { useState } from 'react';
import { ShoppingBag, AlertCircle } from 'lucide-react';
import MemorialPickerModal from './MemorialPickerModal';

interface Props {
  shopifyHandle: string;
  shopifyProductId: string;
  shopifyVariantId: string | null;
  productTitle: string;
  price: number; // in Rappen — for display in modal
  stock: number; // Available units (inventory_status=in_stock)
}

export default function MedaillonCheckoutButton({
  shopifyHandle,
  shopifyProductId,
  shopifyVariantId,
  productTitle,
  price,
  stock,
}: Props) {
  const [open, setOpen] = useState(false);
  const inStock = stock > 0;

  if (!inStock) {
    return (
      <div className="flex flex-col gap-2">
        <button
          disabled
          className="flex-1 flex items-center justify-center gap-2 bg-stone-100 text-stone-400 py-3.5 rounded-xl text-sm font-semibold cursor-not-allowed border border-stone-200"
        >
          <AlertCircle className="w-4 h-4" />
          Ausverkauft
        </button>
        <p className="text-xs text-slate-400 text-center">
          Dieses Modell ist momentan nicht verfügbar. Bitte schaue bald wieder vorbei.
        </p>
      </div>
    );
  }

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
          shopifyHandle={shopifyHandle}
          shopifyProductId={shopifyProductId}
          shopifyVariantId={shopifyVariantId}
          productTitle={productTitle}
          price={price}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
