import type { Metadata } from 'next';
import { Inter, JetBrains_Mono, Noto_Sans_Georgian } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '900'],
  variable: '--font-inter',
});

const notoGeorgian = Noto_Sans_Georgian({
  subsets: ['latin', 'georgian'],
  weight: ['400', '500', '600', '700', '900'],
  variable: '--font-georgian',
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['500', '700'],
  variable: '--font-jetbrains',
});

export const metadata: Metadata = {
  title: 'Poti Special Open 2026',
  description: 'Tennis tournament bracket',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ka" data-theme="light" className={`${inter.variable} ${notoGeorgian.variable} ${jetbrains.variable}`}>
      <body>{children}</body>
    </html>
  );
}
