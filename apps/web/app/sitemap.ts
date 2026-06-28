import type { MetadataRoute } from 'next';
import { SITEMAP_STATIC_ROUTES, SITEMAP_CITIES } from '@/data/master-data';
import { CATALOG_SITEMAP_CATEGORIES } from '@/data/catalog-data';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export default function sitemap(): MetadataRoute.Sitemap {
  const routes: MetadataRoute.Sitemap = SITEMAP_STATIC_ROUTES.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changefreq,
    priority: route.priority,
  }));

  const categoryRoutes: MetadataRoute.Sitemap = CATALOG_SITEMAP_CATEGORIES.map((cat) => ({
    url: `${baseUrl}/categories/${cat}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  const cityRoutes: MetadataRoute.Sitemap = SITEMAP_CITIES.map((city) => ({
    url: `${baseUrl}/city/${city}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  return [...routes, ...categoryRoutes, ...cityRoutes];
}
