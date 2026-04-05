import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-stone-50 flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:block">
        <div className="p-6 h-full flex flex-col">
          <div className="mb-10">
            <h2 className="text-xl font-serif text-slate-800">Nachklang.</h2>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-semibold">Admin Panel</p>
          </div>
          
          <nav className="flex-1 space-y-2">
            <Link 
              href="/admin" 
              className="block px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition font-medium text-sm"
            >
              Control Center
            </Link>
            <Link 
              href="/admin/orders" 
              className="block px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition font-medium text-sm"
            >
              Bestellungen
            </Link>
            <Link 
              href="/admin/medallions" 
              className="block px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition font-medium text-sm"
            >
              Medaillons (QR-Codes)
            </Link>
            <Link 
              href="/admin/products" 
              className="block px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition font-medium text-sm"
            >
              Produkte (Designs)
            </Link>
            <Link 
              href="/admin/settings" 
              className="block px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition font-medium text-sm"
            >
              Einstellungen
            </Link>
          </nav>

          <div className="mt-auto border-t border-slate-100 pt-6">
            <Link href="/dashboard" className="text-sm text-slate-400 hover:text-slate-600 transition flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              Zurück zur App
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
