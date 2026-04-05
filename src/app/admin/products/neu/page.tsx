import ProductForm from '../ProductForm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NewProductPage() {
  return (
    <div className="p-8 md:p-12">
      <header className="mb-10">
        <Link href="/admin/products" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition mb-6">
          <ArrowLeft className="w-4 h-4" /> Zurück zu Produkte
        </Link>
        <h1 className="text-4xl font-serif text-slate-900">Neues Produkt</h1>
        <p className="text-slate-500 mt-2">Lege ein neues Medaillon-Design an.</p>
      </header>

      <ProductForm mode="create" />
    </div>
  );
}
