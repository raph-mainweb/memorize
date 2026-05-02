/**
 * Dashboard Layout — Sidebar Navigation
 * Replaces the top Navbar for all /dashboard/* routes.
 */

import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, BookHeart, QrCode, ShoppingBag, Settings, LogOut, ExternalLink } from 'lucide-react';

const WP_SHOP = `${process.env.WP_URL || 'https://memorize.mainwebsite.ch'}/shop`;

const NAV_ITEMS = [
  { label: 'Übersicht',        href: '/dashboard',                  icon: LayoutDashboard, external: false },
  { label: 'Gedenkseiten',     href: '/dashboard/gedenkseiten',     icon: BookHeart,       external: false },
  { label: 'Meine Medaillons', href: '/dashboard/medaillon',        icon: QrCode,          external: false },
  { label: 'Medaillon kaufen', href: WP_SHOP,                       icon: ShoppingBag,     external: true  },
  { label: 'Einstellungen',    href: '/dashboard/settings',         icon: Settings,        external: false },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const email = user.email || '';
  const initials = email.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen flex bg-stone-50">

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-stone-100 sticky top-0 h-screen">
        {/* Logo */}
        <div className="px-6 py-6 border-b border-stone-100">
          <span className="font-serif text-xl text-slate-900 tracking-tight">nachklang</span>
          <p className="text-[11px] text-slate-400 mt-0.5 font-medium tracking-wider uppercase">Mein Bereich</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-3 pt-3 pb-2">Übersicht</p>
          {NAV_ITEMS.slice(0, 2).map((item) => (
            <SidebarLink key={item.href} item={item} />
          ))}
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-3 pt-5 pb-2">Medaillons</p>
          {NAV_ITEMS.slice(2, 4).map((item) => (
            <SidebarLink key={item.href} item={item} />
          ))}
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-3 pt-5 pb-2">Konto</p>
          {NAV_ITEMS.slice(4).map((item) => (
            <SidebarLink key={item.href} item={item} />
          ))}
        </nav>

        {/* User + Logout */}
        <div className="p-4 border-t border-stone-100">
          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-stone-50 transition">
            <div className="w-9 h-9 rounded-full bg-slate-800 text-white text-xs font-semibold flex items-center justify-center flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">{email}</p>
            </div>
            <form action="/auth/logout" method="POST">
              <button type="submit" title="Abmelden" className="text-slate-400 hover:text-slate-700 transition">
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* ── Mobile top bar ──────────────────────────────────────────────────── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-stone-100 px-4 py-3 flex items-center justify-between">
        <span className="font-serif text-lg text-slate-900">nachklang</span>
        <div className="flex items-center gap-3">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className="text-slate-500 hover:text-slate-900 transition">
              <item.icon className="w-5 h-5" />
            </Link>
          ))}
        </div>
      </div>

      {/* ── Page content ────────────────────────────────────────────────────── */}
      <main className="flex-1 md:min-h-screen pt-16 md:pt-0 overflow-auto">
        {children}
      </main>
    </div>
  );
}

function SidebarLink({ item }: { item: typeof NAV_ITEMS[number] }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      target={item.external ? '_blank' : undefined}
      rel={item.external ? 'noopener noreferrer' : undefined}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-600 hover:bg-stone-50 hover:text-slate-900 transition group"
    >
      <Icon className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition flex-shrink-0" />
      <span className="flex-1">{item.label}</span>
      {item.external && <ExternalLink className="w-3 h-3 text-slate-300" />}
    </Link>
  );
}
