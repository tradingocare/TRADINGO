/* ═══════════════════════════════════════════════════════════════
   RECOVERY: app/layout.tsx
   Source: Session reconstruction (21 June 2026)
   Confidence: HIGH
   ═══════════════════════════════════════════════════════════════ */

import type { Metadata, Viewport } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/shared/navbar';
import { Footer } from '@/components/shared/footer';
import { Providers } from '@/components/providers/providers';
import { ServiceWorkerRegister } from '@/components/shared/service-worker-register';
import { PwaInstallPrompt } from '@/components/shared/pwa-install-prompt';
import CompareBar from '@/components/product/compare-bar';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const playfair = Playfair_Display({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800', '900'], variable: '--font-display' });

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL || process.env.NEXT_PUBLIC_SITE_URL}`
  : 'http://localhost:3000';

export const viewport: Viewport = {
  themeColor: '#1F0318',
};

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "TRADINGO\u2122 | The Global's Smart Trade System\u2122",
    template: '%s | TRADINGO\u2122',
  },
  description:
    "TRADINGO\u2122 is a Global's Smart Trade System powered by TRADHEXA\u2122, enabling buyers, sellers, manufacturers, distributors and service providers to discover, connect, negotiate and grow through trust, technology and transparency.",
  keywords: [
    'TRADINGO',
    'TRADHEXA',
    "Global's Smart Trade System",
    'B2B Marketplace',
    'Buyers',
    'Sellers',
    'Manufacturers',
    'Suppliers',
    'RFQ',
    'Trade Matching',
    'Escrow',
    'GOCASH',
    'India',
    'Global Trade',
  ],
  icons: {
    icon: [
      { url: '/logo/trdn.png', type: 'image/png', sizes: '792x547' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: [
      { url: '/logo/trdn.png', sizes: '792x547', type: 'image/png' },
    ],
  },
  openGraph: {
    title: "TRADINGO\u2122 | The Global's Smart Trade System",
    description:
      "TRADINGO\u2122 is a Global's Smart Trade System powered by TRADHEXA\u2122, enabling buyers, sellers, manufacturers, distributors and service providers to discover, connect, negotiate and grow through trust, technology and transparency.",
    type: 'website',
    locale: 'en_IN',
    images: [{ url: '/logo/trdn.png', width: 792, height: 547, alt: 'TRADINGO' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "TRADINGO\u2122 | The Global's Smart Trade System",
    description:
      "TRADINGO\u2122 is a Global's Smart Trade System powered by TRADHEXA\u2122, enabling buyers, sellers, manufacturers, distributors and service providers to discover, connect, negotiate and grow through trust, technology and transparency.",
    images: ['/logo/trdn.png'],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${playfair.variable} min-h-screen antialiased`}>
        <Providers>
          <Navbar />
          <main className="pt-16">{children}</main>
          <Footer />
        </Providers>
        <CompareBar />
        <ServiceWorkerRegister />
        <PwaInstallPrompt />
      </body>
    </html>
  );
}
