import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'TRADINGO | The Global Smart Trade System',
    short_name: 'TRADINGO',
    id: '/',
    description: 'TRADINGO — The Global Smart Trade System. Discover, connect, negotiate, and grow through trust, technology, and transparency.',
    start_url: '/',
    display: 'standalone',
    background_color: '#00001C',
    theme_color: '#00072D',
    orientation: 'portrait-primary',
    categories: ['business', 'shopping', 'ecommerce'],
    lang: 'en-IN',
    icons: [
      { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}