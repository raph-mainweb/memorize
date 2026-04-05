'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Loader2 } from 'lucide-react';

interface Props {
  productId: string;
  productTitle: string;
}

export default function MedaillonCheckoutButton({ productId, productTitle }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleBuy() {
    setLoading(true);

    // Check auth first by calling the checkout endpoint
    const res = await fetch('/api/checkout/medallion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: productId }),
    });

    if (res.status === 401) {
      // Not logged in – send to login with redirect back here
      router.push('/auth/login?redirect=/medaillons');
      return;
    }

    const data = await res.json();

    if (data.url) {
      window.location.href = data.url;
    } else {
      console.error('No checkout URL received', data);
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleBuy}
      disabled={loading}
      className="flex-1 flex items-center justify-center gap-2 bg-slate-900 text-white py-3.5 rounded-xl text-sm font-semibold hover:bg-slate-800 transition shadow-sm disabled:opacity-60"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <ShoppingBag className="w-4 h-4" />
      )}
      {loading ? 'Wird geladen...' : `${productTitle} bestellen`}
    </button>
  );
}
