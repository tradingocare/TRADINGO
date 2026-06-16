import type { MetadataRoute } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

const staticRoutes = [
  '', '/trading', '/products', '/categories', '/rfq',
  '/for-sellers', '/for-buyers', '/tradhexa', '/gocash', '/tradgo',
  '/seller-plans', '/tradbuy', '/about-tradingo', '/why-tradingo',
  '/contact', '/privacy', '/terms', '/search',
];

const categories = [
  'industrial-machinery', 'electronics', 'textiles', 'chemicals',
  'packaging', 'automotive', 'food-agro', 'construction',
];

const cities = [
  'mumbai', 'delhi', 'bengaluru', 'ahmedabad', 'chennai',
  'kolkata', 'pune', 'hyderabad', 'jaipur', 'lucknow',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const routes: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'weekly' : 'monthly',
    priority: route === '' ? 1.0 : 0.8,
  }));

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `${baseUrl}/categories/${cat}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  const cityRoutes: MetadataRoute.Sitemap = cities.map((city) => ({
    url: `${baseUrl}/city/${city}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  return [...routes, ...categoryRoutes, ...cityRoutes];
}
