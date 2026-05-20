import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'SYNAPSE — Daily Brain Challenge',
    template: '%s · SYNAPSE',
  },
  description:
    'A 2-minute daily cognitive duel. Test your memory, speed, and reasoning. See how you rank against the world.',
  keywords: ['brain training', 'daily challenge', 'cognitive games', 'ELO ranking', 'wordle for brains'],
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://synapse.game'),
  openGraph: {
    type: 'website',
    siteName: 'SYNAPSE',
    title: 'SYNAPSE — Daily Brain Challenge',
    description: "Play today's challenge. See your Brain ELO.",
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SYNAPSE — Daily Brain Challenge',
    description: "Play today's challenge. See your Brain ELO.",
    images: ['/og-image.png'],
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.png', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'SYNAPSE',
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: '#7c3aed',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-slate-950 text-white">
        {children}
      </body>
    </html>
  );
}
