/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   RECOVERY: app/layout.tsx
   Source: Session reconstruction (21 June 2026)
   Confidence: HIGH
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

import type { Metadata, Viewport } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/shared/navbar';
import { Footer } from '@/components/shared/footer';
import ClaimYourGrowth from '@/components/sections/ClaimYourGrowth';
import { Providers } from '@/components/providers/providers';
import { ServiceWorkerRegister } from '@/components/shared/service-worker-register';
import { PwaInstallPrompt } from '@/components/shared/pwa-install-prompt';
import { Toaster } from '@/components/ui/toaster';
import { ScrollToTop } from '@/components/ui/scroll-to-top';
import CompareBar from '@/components/product/compare-bar';
import { GlowTracker } from '@/components/shared/glow-tracker';
import { WebVitalsTracker } from '@/components/web-vitals-tracker';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const playfair = Playfair_Display({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800', '900'], variable: '--font-display' });

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tradingo.in';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#00001C',
};

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "TRADINGO | The Global Smart Trade System",
    template: '%s | TRADINGO',
  },
  description:
    "TRADINGO is a Global Smart Trade System, enabling buyers, sellers, manufacturers, distributors, and service providers worldwide to discover, connect, negotiate, and grow through trust, technology, and transparency.",
  keywords: [
    'TRADINGO',
    'TRADHEXA',
    'Global Smart Trade System',
    'Global B2B Marketplace',
    'International Trade Platform',
    'Buyers',
    'Sellers',
    'Manufacturers',
    'Suppliers',
    'Distributors',
    'Service Providers',
    'RFQ',
    'Trade Matching',
    'Escrow',
    'GOCASH',
    'Cross-Border Trade',
    'Global Commerce',
    'Worldwide Business Network',
  ],
  applicationName: 'TRADINGO',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'TRADINGO',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icons/icon-512x512.png', type: 'image/png', sizes: '512x512' },
      { url: '/logo/trdn5.png', type: 'image/png', sizes: '1536x1024' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon-180x180.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    title: "TRADINGO | The Global Smart Trade System",
    description:
      "TRADINGO is a Global Smart Trade System, enabling businesses worldwide to discover, connect, negotiate, and grow.",
    type: 'website',
    locale: 'en_US',
    url: 'https://tradingo.in',
    siteName: 'TRADINGO',
    images: [
      { url: '/og/tradingo-og-1200x630.png', width: 1200, height: 630, alt: 'TRADINGO — Trading Right. Go Bright.' },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "TRADINGO | The Global Smart Trade System",
    description:
      "TRADINGO is a Global Smart Trade System, enabling businesses worldwide to discover, connect, negotiate, and grow.",
    images: ['/og/tradingo-og-1200x630.png'],
  },
  alternates: {
    canonical: 'https://tradingo.in',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${playfair.variable} min-h-screen antialiased`}>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-accent focus:text-btn-primary-text focus:rounded-lg focus:outline-none">
          Skip to main content
        </a>
        <Providers>
          <Navbar />
          <main id="main-content" className="pt-16">{children}</main>
          <ClaimYourGrowth />
          <Footer />
        </Providers>
        <CompareBar />
        <ServiceWorkerRegister />
        <PwaInstallPrompt />
        <Toaster />
        <ScrollToTop />
        <GlowTracker />
        <WebVitalsTracker />
      </body>
    </html>
  );
}
