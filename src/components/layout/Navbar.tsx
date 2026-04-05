'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export default function Navbar() {
  const [user, setUser] = useState<{ email?: string; id?: string } | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const supabase = createClient();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    // Initial fetch
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    fetchUser();

    // Listen to changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsDropdownOpen(false);
    router.push('/');
  };

  const userInitials = user?.email?.substring(0, 2).toUpperCase() || 'NA';

  return (
    <nav className="sticky top-0 z-50 w-full h-14 bg-white border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 h-full flex items-center justify-between">
        
        {/* Left: Logo */}
        <Link href="/" className="font-serif text-xl font-bold tracking-tight text-slate-900 flex items-center gap-1 group">
          Nachklang <span className="text-sage-500 font-normal italic group-hover:text-sage-600 transition-colors">CH</span>
        </Link>

        {/* Center: Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="/wie-es-funktioniert" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition">
            Wie funktioniert&apos;s
          </Link>
          <Link href="/medaillons" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition">
            Medaillons
          </Link>
          <Link href="/ueber-uns" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition">
            Über uns
          </Link>
        </div>

        {/* Right: Desktop Auth */}
        <div className="hidden md:flex items-center gap-6">
          {!user ? (
            <>
              <Link href="/auth/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition bg-transparent border-none">
                Anmelden
              </Link>
              <Link href="/dashboard/neu" className="text-sm font-medium bg-slate-900 text-white px-5 py-2 rounded-full hover:bg-slate-800 transition shadow-sm hover:shadow-md">
                Gedenkseite erstellen
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <Link href="/dashboard/neu" className="text-sm font-medium border border-slate-300 text-slate-700 px-5 py-2 rounded-full hover:bg-slate-50 transition shadow-sm">
                + Neue Seite
              </Link>
              
              <div className="h-6 w-px bg-stone-300"></div>

              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-full pl-2 pr-4 py-1.5 transition shadow-sm"
                >
                  <div className="w-6 h-6 flex items-center justify-center bg-slate-900 text-white text-[10px] font-bold rounded-full">
                    {userInitials}
                  </div>
                  <span className="text-sm font-medium text-slate-700">Meine Seiten</span>
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden py-1">
                    <Link 
                      href="/dashboard" 
                      onClick={() => setIsDropdownOpen(false)}
                      className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      Dashboard
                    </Link>
                    <Link 
                      href="/dashboard/settings" 
                      onClick={() => setIsDropdownOpen(false)}
                      className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      Kontoeinstellungen
                    </Link>
                    <button 
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden flex items-center">
          <button 
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="text-slate-600 hover:text-slate-900"
          >
            {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileOpen && (
        <div className="md:hidden absolute top-14 left-0 w-full bg-white border-b border-slate-100 shadow-xl py-4 flex flex-col px-6">
          <div className="flex flex-col gap-4 pb-6 border-b border-slate-100">
            <Link href="/wie-es-funktioniert" onClick={() => setIsMobileOpen(false)} className="text-base font-medium text-slate-700">Wie funktioniert&apos;s</Link>
            <Link href="/medaillons" onClick={() => setIsMobileOpen(false)} className="text-base font-medium text-slate-700">Medaillons</Link>
            <Link href="/ueber-uns" onClick={() => setIsMobileOpen(false)} className="text-base font-medium text-slate-700">Über uns</Link>
          </div>
          
          <div className="pt-6 flex flex-col gap-4">
            {!user ? (
              <>
                <Link href="/auth/login" onClick={() => setIsMobileOpen(false)} className="text-base font-medium text-slate-700">Anmelden</Link>
                <Link href="/dashboard/neu" onClick={() => setIsMobileOpen(false)} className="text-base font-medium bg-slate-900 text-white text-center py-3 rounded-xl">Gedenkseite erstellen</Link>
              </>
            ) : (
               <>
                <div className="flex items-center gap-3 mb-2">
                   <div className="w-8 h-8 flex items-center justify-center bg-slate-900 text-white text-xs font-bold rounded-full">
                     {userInitials}
                   </div>
                   <span className="text-sm text-slate-500">{user.email}</span>
                </div>
                <Link href="/dashboard" onClick={() => setIsMobileOpen(false)} className="text-base font-medium text-slate-700">Dashboard</Link>
                <Link href="/dashboard/settings" onClick={() => setIsMobileOpen(false)} className="text-base font-medium text-slate-700">Kontoeinstellungen</Link>
                <Link href="/dashboard/neu" onClick={() => setIsMobileOpen(false)} className="text-base font-medium text-slate-700">+ Neue Seite erstellen</Link>
                <button onClick={handleLogout} className="text-base font-medium text-left text-red-600">Logout</button>
               </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
