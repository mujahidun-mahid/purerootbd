import { NextResponse } from 'next/server';
import { adminAuthorized } from '@/lib/supabaseServer';
import { getAdminDashboardData } from '@/lib/adminDashboard';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  if (!adminAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await getAdminDashboardData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Admin dashboard error:', error);
    return NextResponse.json({ error: error.message || 'Unable to load dashboard data.' }, { status: 500 });
  }
}

