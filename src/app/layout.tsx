import type { Metadata } from 'next';
import { Inter_Tight, Montserrat, Dancing_Script } from 'next/font/google';
import './globals.css';
import './custom.css';

// Inter Tight — headlines & display text
const interTight = Inter_Tight({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter-tight',
  display: 'swap',
});

// Montserrat — body & UI text
const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-montserrat',
  display: 'swap',
});

// Dancing Script — decorative subtitles above H1
const dancingScript = Dancing_Script({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-dancing-script',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Nachklang CH — Die digitale Gedenkplattform',
  description: 'Erstelle eine wunderschöne Gedenkseite für deine Liebsten. Kombiniert mit hochwertigen QR-Medaillons direkt am Grab.',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="de"
      className={`${interTight.variable} ${montserrat.variable} ${dancingScript.variable} scroll-smooth`}
    >
      <head />
      <body className="font-sans selection:bg-brand-200 min-h-screen flex flex-col bg-stone-50 text-slate-800 antialiased">
        <main className="flex-grow flex flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}
