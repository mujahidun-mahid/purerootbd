import { loadProducts, loadCategories } from '@/lib/products-server';
import { SITE_URL } from '@/lib/site-defaults';

// Generate the sitemap from the live catalog, never from the demo registry.
// A dynamic sitemap also means products added through the admin dashboard
// appear without rebuilding the whole application.
export const dynamic = 'force-dynamic';

const pages = [
  ['/', 1, 'daily'],
  ['/shop', 0.9, 'daily'],
  ['/about', 0.6, 'monthly'],
  ['/contact', 0.6, 'monthly'],
  ['/faq', 0.6, 'monthly'],
  ['/reviews', 0.6, 'monthly'],
  ['/track-order', 0.7, 'monthly'],
  ['/shipping', 0.5, 'yearly'],
  ['/returns', 0.5, 'yearly'],
  ['/privacy', 0.4, 'yearly'],
  ['/terms', 0.4, 'yearly'],
];

export default async function sitemap() {
  const lastModified = new Date();

  // `allowFallback: false` is important: if Supabase is unavailable we would
  // rather omit catalog URLs than publish dead demo-product URLs.
  let products = [];
  let categories = [];
  try {
    [products, categories] = await Promise.all([
      loadProducts({ allowFallback: false }),
      loadCategories({ allowFallback: false }),
    ]);
  } catch (error) {
    console.error('Sitemap catalog lookup failed:', error?.message);
  }

  return [
    ...pages.map(([path, priority, changeFrequency]) => ({
      url: `${SITE_URL}${path}`,
      lastModified,
      changeFrequency,
      priority,
    })),
    ...categories.map((c) => ({
      url: `${SITE_URL}/category/${c.slug}`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.8,
    })),
    ...products.map((p) => ({
      url: `${SITE_URL}/product/${p.slug}`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.9,
    })),
  ];
}
