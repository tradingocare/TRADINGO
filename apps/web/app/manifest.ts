import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'TRADINGO — India\'s First TEM™ E-Marketplace',
    short_name: 'TRADINGO',
    description: 'India\'s first TEM™ E-Marketplace connecting buyers and sellers through trust, technology, and transparent trading.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#2563eb',
    orientation: 'portrait-primary',
    categories: ['business', 'shopping', 'ecommerce'],
    lang: 'en-IN',
    icons: [
      { src: '/logo/trdn.png', sizes: '792x547', type: 'image/png' },
      { src: '/logo/trdn.png', sizes: '792x547', type: 'image/png', purpose: 'maskable' },
    ],
    screenshots: [
      {
        src: '/logo/trdn.png',
        sizes: '792x547',
        type: 'image/png',
        form_factor: 'wide',
        label: 'TRADINGO Marketplace',
      },
    ],
  };
}
