/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // CMS pages accept admin-supplied image URLs from arbitrary hosts. Keeping
  // Next's optimizer on would require allow-listing every hostname and a
  // working sharp binary on the hosting account; unoptimized images preserve
  // existing CMS content on both Vercel and HostSeba. Product/storefront
  // images already use plain <img> and are unaffected by this setting.
  images: {
    unoptimized: true,
  },
  // Baseline hardening headers. No CSP is set here on purpose: the
  // storefront renders admin-authored CMS HTML and hotlinks third-party
  // payment logos, so a strict policy needs per-route tuning first.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};
export default nextConfig;
