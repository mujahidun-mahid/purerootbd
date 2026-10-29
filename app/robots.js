import { SITE_URL } from '@/lib/site-defaults';

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api/', '/cart', '/checkout', '/account', '/wishlist', '/search', '/payment', '/order-confirmation'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
