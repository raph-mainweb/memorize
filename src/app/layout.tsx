import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });

export const metadata: Metadata = {
  title: 'Nachklang CH - Die analoge und digitale Gedenkplattform',
  description: 'Erstelle eine wunderschöne Gedenkseite für deine Liebsten. Kombiniert mit hochwertigen QR-Medaillons direkt am Grab. (Stock-Modell, Sofortversand)',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className={`${inter.variable} ${playfair.variable} scroll-smooth`}>
      <body className="font-sans selection:bg-stone-200 min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}
