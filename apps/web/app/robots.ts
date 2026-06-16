import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/seller/', '/buyer/', '/admin/', '/login/', '/register/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
