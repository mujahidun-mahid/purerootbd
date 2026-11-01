import { NextResponse } from 'next/server';
import { getSiteSettings } from '@/lib/site-settings';

// ISR: revalidate site settings every 60 seconds.
export const revalidate = 60;

export async function GET() {
  const settings = await getSiteSettings();
  return NextResponse.json(settings, {
    headers: { 'cache-control': 'public, max-age=60, s-maxage=60' }
  });
}

