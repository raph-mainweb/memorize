'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';

export default function NavbarWrapper() {
  const pathname = usePathname();

  // Do not render the public navbar in admin routes
  if (pathname.startsWith('/admin')) {
    return null;
  }

  return <Navbar />;
}
