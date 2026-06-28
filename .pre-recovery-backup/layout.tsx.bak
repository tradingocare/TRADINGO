import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/shared/navbar';
import { Footer } from '@/components/shared/footer';
import { Providers } from '@/components/providers/providers';
import { ServiceWorkerRegister } from '@/components/shared/service-worker-register';
import { PwaInstallPrompt } from '@/components/shared/pwa-install-prompt';
import CompareBar from '@/components/product/compare-bar';

const inter = Inter({ subsets: ['latin'] });

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL || process.env.NEXT_PUBLIC_SITE_URL}`
  : 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'TRADINGO - India\'s First TEM™ E-Marketplace',
    template: '%s | TRADINGO',
  },
  description:
    'TRADINGO is India\'s first TEM™ E-Marketplace connecting buyers and sellers through trust, technology, and transparent trading. Trade products, earn GOCASH rewards, and grow your business.',
  keywords: [
    'TRADINGO',
    'TEM',
    'E-Marketplace',
    'Online Trading',
    'India Marketplace',
    'B2B Trading',
    'RFQ',
    'GOCASH',
    'TRADGO',
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
    title: 'TRADINGO - India\'s First TEM™ E-Marketplace',
    description:
      'India\'s first TEM™ E-Marketplace connecting buyers and sellers through trust, technology, and transparent trading.',
    type: 'website',
    locale: 'en_IN',
    images: [{ url: '/logo/trdn.png', width: 792, height: 547, alt: 'TRADINGO' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TRADINGO - India\'s First TEM™ E-Marketplace',
    description:
      'India\'s first TEM™ E-Marketplace connecting buyers and sellers through trust, technology, and transparent trading.',
    images: ['/logo/trdn.png'],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-surface text-text-primary antialiased dark:bg-dark-surface dark:text-dark-text-primary`}>
        <Providers>
          <Navbar />
          <main>{children}</main>
          <Footer />
        </Providers>
        <CompareBar />
        <ServiceWorkerRegister />
        <PwaInstallPrompt />
      </body>
    </html>
  );
}
