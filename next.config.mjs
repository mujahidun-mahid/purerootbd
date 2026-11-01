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
    unoptimized: false,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'qyrbwvyuqdypvsjdkgkm.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // Baseline hardening headers.
  //
  // CSP is REPORT-ONLY for now: violations are logged by the browser but
  // nothing is blocked. The storefront renders admin-authored CMS HTML,
  // hotlinks payment logos and loads Google Fonts, so the policy is audited
  // and observed in production before it is enforced. Notes on the sources:
  //   - script-src 'unsafe-inline': Next.js inlines its hydration bootstrap.
  //   - style-src 'unsafe-inline': many components set React style attributes.
  //   - fonts.googleapis.com / fonts.gstatic.com: @import in globals.css.
  //   - img-src https:: product images come from Supabase Storage and admins
  //     may paste any https image URL.
  //   - connect-src https://*.supabase.co: AdminConsole opens a browser
  //     Supabase client for realtime; everything else uses same-origin APIs.
  // No report-uri is set because there is no collector yet; violations appear
  // in the browser console/DevTools and can be wired to a reporter later.
  async headers() {
    const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'self'",
      "form-action 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      "media-src 'self' https:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
      "frame-src 'self'",
      "worker-src 'self' blob:",
      "manifest-src 'self'",
    ].join('; ');

    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Content-Security-Policy-Report-Only', value: csp },
        ],
      },
      // Never cache the admin workspace or any admin API response at the
      // browser, an intermediate proxy or the Vercel edge.
      {
        source: '/ayc/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, max-age=0, must-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
        ],
      },
      {
        source: '/api/admin/:path*',
        headers: [{ key: 'Cache-Control', value: 'no-store' }],
      },
      // Public storefront pages: cache at browser and edge for 60 seconds.
      // More specific admin routes above take precedence.
      {
        source: '/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=60, s-maxage=60' },
        ],
      },
    ];
  },
};
export default nextConfig;
