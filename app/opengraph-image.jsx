import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Pure Roots | Premium Nutrition & Natural Foods';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#14532d',
          backgroundImage:
            'radial-gradient(circle at 85% 15%, rgba(74,222,128,0.35), transparent 45%), radial-gradient(circle at 10% 90%, rgba(134,239,172,0.22), transparent 40%)',
          padding: '72px 80px',
          color: '#f0fdf4',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: 24,
              backgroundColor: '#166534',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="56" height="56" viewBox="0 0 64 64">
              <path d="M32 55V31" stroke="#bbf7d0" strokeWidth="4" strokeLinecap="round" fill="none" />
              <path d="M32 34c0-10 8-18 18-18 0 10-8 18-18 18z" fill="#4ade80" />
              <path d="M32 43c0-8-6-14-14-14 0 8 6 14 14 14z" fill="#86efac" />
            </svg>
          </div>
          <div style={{ fontSize: 40, letterSpacing: 4, color: '#bbf7d0', fontWeight: 600 }}>
            PURE ROOTS
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', fontSize: 78, fontWeight: 700, lineHeight: 1.1 }}>
            <span>Nature&rsquo;s Nutrition,</span>
            <span>Delivered Pure</span>
          </div>
          <div style={{ display: 'flex', fontSize: 32, color: '#bbf7d0' }}>
            Premium nuts, seeds, spices &amp; natural honey
          </div>
        </div>

        <div style={{ display: 'flex', fontSize: 26, color: '#86efac', letterSpacing: 1 }}>
          purerootsbd.vercel.app
        </div>
      </div>
    ),
    { ...size }
  );
}
