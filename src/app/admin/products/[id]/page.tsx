import { createAdminClient } from '@/utils/supabase/admin';
import { notFound } from 'next/navigation';
import ProductForm from '../ProductForm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface EditProductPageProps {
  params: { id: string };
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const supabase = createAdminClient();
  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!product) {
    notFound();
  }

  return (
    <div className="p-8 md:p-12">
      <header className="mb-10">
        <Link href="/admin/products" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition mb-6">
          <ArrowLeft className="w-4 h-4" /> Zurück zu Produkte
        </Link>
        <h1 className="text-4xl font-serif text-slate-900">{product.title}</h1>
        <p className="text-slate-500 mt-2">Produktdetails bearbeiten.</p>
      </header>

      <ProductForm
        mode="edit"
        initialData={{
          id: product.id,
          title: product.title,
          short_description: product.short_description,
          description: product.description,
          price_in_cents: product.price_in_cents,
          usp: product.usp || [],
          gallery_images: product.gallery_images || [],
          is_active: product.is_active,
          stripe_price_id: product.stripe_price_id,
        }}
      />
    </div>
  );
}
