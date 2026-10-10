import { products, categories } from '@/lib/products';

const BASE = 'https://purerootsbd.vercel.app';

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

export default function sitemap() {
  const lastModified = new Date();

  return [
    ...pages.map(([path, priority, changeFrequency]) => ({
      url: `${BASE}${path}`,
      lastModified,
      changeFrequency,
      priority,
    })),
    ...categories.map((c) => ({
      url: `${BASE}/category/${c.slug}`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.8,
    })),
    ...products.map((p) => ({
      url: `${BASE}/product/${p.slug}`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.9,
    })),
  ];
}
