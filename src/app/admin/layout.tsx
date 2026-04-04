import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { LayoutDashboard, Package, ShoppingCart, LogOut } from 'lucide-react';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Middleware strictly handles protection natively on the edge; this is fallback logic.
  if (!user) redirect('/auth/login');

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 selection:bg-sage-200">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-900 text-slate-300 md:min-h-screen flex flex-col z-20 shadow-xl shadow-slate-900/10">
        <div className="p-6">
          <Link href="/admin" className="font-serif text-2xl font-bold tracking-tight text-white block">
            Nachklang <span className="text-sage-400 font-normal italic">Admin</span>
          </Link>
          <div className="mt-2 text-[9px] font-bold uppercase tracking-widest text-slate-500 border border-slate-700 bg-slate-800 rounded px-2 py-0.5 inline-block">Service Role Enabled</div>
        </div>

        <nav className="flex-grow px-4 space-y-2 mt-4 flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible pb-4 md:pb-0 scrollbar-hide">
          <Link href="/admin" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800 text-white font-medium text-sm transition shrink-0 shadow-sm">
            <LayoutDashboard className="w-4 h-4" /> Übersicht
          </Link>
          <Link href="/admin/stock" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-800/50 hover:text-white font-medium text-sm transition shrink-0">
            <Package className="w-4 h-4" /> QR-Bestand
          </Link>
          <Link href="/admin/orders" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-800/50 hover:text-white font-medium text-sm transition shrink-0">
            <ShoppingCart className="w-4 h-4" /> Bestellwesen
          </Link>
          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-800/50 hover:text-white font-medium text-sm transition shrink-0 mt-8 border-t border-slate-800/40">
            Kundenansicht
          </Link>
        </nav>

        <div className="p-4 mt-auto">
          <form action={async () => { "use server"; const { signout } = await import('@/app/auth/actions'); await signout(); }}>
            <button className="flex w-full items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 text-red-400 hover:text-red-300 font-medium text-sm transition">
              <LogOut className="w-4 h-4" /> System ausloggen
            </button>
          </form>
        </div>
      </aside>

      {/* Dynamic Render Frame */}
      <main className="flex-1 overflow-y-auto w-full">
        {children}
      </main>

    </div>
  );
}
