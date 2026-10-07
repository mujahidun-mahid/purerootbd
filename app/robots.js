const BASE = 'https://pure-roots-fawn.vercel.app';

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api/', '/cart', '/checkout', '/account', '/wishlist', '/search', '/payment', '/order-confirmation'],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
