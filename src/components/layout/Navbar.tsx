'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

interface NavbarProps {
  logoUrl?: string | null;
  logoText?: string | null;
}

export default function Navbar({ logoUrl, logoText }: NavbarProps) {
  const [user, setUser] = useState<{ email?: string; id?: string } | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const supabase = createClient();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => { subscription.unsubscribe(); };
  }, [supabase]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsDropdownOpen(false);
    router.push('/');
  };

  const userInitials = user?.email?.substring(0, 2).toUpperCase() || 'NA';

  const LogoArea = () => (
    <Link href="/" className="flex items-center gap-2.5 group shrink-0">
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt={logoText || 'Nachklang'}
          width={160}
          height={40}
          className="h-9 w-auto object-contain"
          priority
        />
      ) : (
        <span className="font-heading font-semibold text-xl text-navy-700 tracking-tight group-hover:text-brand-600 transition-colors">
          {logoText || 'Nachklang'}
          <span className="font-script font-normal text-brand-500 ml-1 text-lg">CH</span>
        </span>
      )}
    </Link>
  );

  return (
    <nav className="sticky top-0 z-50 w-full h-14 bg-white/95 backdrop-blur-sm border-b border-brand-100">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 h-full flex items-center justify-between">

        {/* Logo */}
        <LogoArea />

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="/wie-es-funktioniert" className="text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors">
            Wie funktionierts
          </Link>
          <Link href="/medaillons" className="text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors">
            Medaillons
          </Link>
          <Link href="/ueber-uns" className="text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors">
            Über uns
          </Link>
        </div>

        {/* Desktop Auth */}
        <div className="hidden md:flex items-center gap-4">
          {!user ? (
            <>
              <Link href="/auth/login" className="text-sm font-medium text-slate-600 hover:text-brand-700 transition-colors">
                Anmelden
              </Link>
              <Link
                href="/dashboard/neu"
                className="btn-primary text-sm py-2 px-5"
              >
                Gedenkseite erstellen
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard/neu"
                className="btn-secondary text-sm py-2 px-5"
              >
                + Neue Seite
              </Link>

              <div className="h-6 w-px bg-brand-100" />

              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 border border-brand-200 bg-white hover:bg-brand-50 rounded-full pl-2 pr-4 py-1.5 transition shadow-sm"
                >
                  <div className="w-6 h-6 flex items-center justify-center bg-brand-500 text-white text-[10px] font-bold rounded-full">
                    {userInitials}
                  </div>
                  <span className="text-sm font-medium text-slate-700">Meine Seiten</span>
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-brand-100 overflow-hidden py-1">
                    <Link href="/dashboard" onClick={() => setIsDropdownOpen(false)} className="block px-4 py-2 text-sm text-slate-700 hover:bg-brand-50 hover:text-brand-700">
                      Dashboard
                    </Link>
                    <Link href="/dashboard/settings" onClick={() => setIsDropdownOpen(false)} className="block px-4 py-2 text-sm text-slate-700 hover:bg-brand-50 hover:text-brand-700">
                      Kontoeinstellungen
                    </Link>
                    <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Mobile burger */}
        <div className="md:hidden flex items-center">
          <button onClick={() => setIsMobileOpen(!isMobileOpen)} className="text-slate-600 hover:text-brand-600">
            {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileOpen && (
        <div className="md:hidden absolute top-14 left-0 w-full bg-white border-b border-brand-100 shadow-xl py-4 flex flex-col px-6">
          <div className="flex flex-col gap-4 pb-6 border-b border-brand-100">
            <Link href="/wie-es-funktioniert" onClick={() => setIsMobileOpen(false)} className="text-base font-medium text-slate-700 hover:text-brand-600">Wie funktionierts</Link>
            <Link href="/medaillons" onClick={() => setIsMobileOpen(false)} className="text-base font-medium text-slate-700 hover:text-brand-600">Medaillons</Link>
            <Link href="/ueber-uns" onClick={() => setIsMobileOpen(false)} className="text-base font-medium text-slate-700 hover:text-brand-600">Über uns</Link>
          </div>

          <div className="pt-6 flex flex-col gap-4">
            {!user ? (
              <>
                <Link href="/auth/login" onClick={() => setIsMobileOpen(false)} className="text-base font-medium text-slate-700">Anmelden</Link>
                <Link href="/dashboard/neu" onClick={() => setIsMobileOpen(false)} className="btn-primary text-base text-center">
                  Gedenkseite erstellen
                </Link>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 flex items-center justify-center bg-brand-500 text-white text-xs font-bold rounded-full">
                    {userInitials}
                  </div>
                  <span className="text-sm text-slate-500">{user.email}</span>
                </div>
                <Link href="/dashboard" onClick={() => setIsMobileOpen(false)} className="text-base font-medium text-slate-700 hover:text-brand-600">Dashboard</Link>
                <Link href="/dashboard/settings" onClick={() => setIsMobileOpen(false)} className="text-base font-medium text-slate-700 hover:text-brand-600">Kontoeinstellungen</Link>
                <Link href="/dashboard/neu" onClick={() => setIsMobileOpen(false)} className="text-base font-medium text-slate-700 hover:text-brand-600">+ Neue Seite erstellen</Link>
                <button onClick={handleLogout} className="text-base font-medium text-left text-red-600">Logout</button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
