import './globals.css';
import type { Metadata, Viewport } from 'next';
import AuthProvider from '@/components/AuthProvider';

export const metadata: Metadata = {
  title: 'Kotak Tugas',
  description: 'Tempat mahasiswa desain mengumpulkan karya dan dosen memeriksa, menilai, dan memberi umpan balik.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600..800&family=DM+Mono:wght@400;500&family=Instrument+Sans:wght@400;500;600;700&display=swap"
        />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
