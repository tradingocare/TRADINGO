import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tradingo.in';
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Prefix form covers BOTH bare paths (/login, /register) and their
        // subpaths (/register/buyer, /register/vendor, ...). Robots.txt uses
        // prefix matching, so the prior '/login/' and '/register/' entries
        // never matched the bare auth paths.
        disallow: ['/api/', '/_next/', '/seller/', '/buyer/', '/admin/', '/login', '/register'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
