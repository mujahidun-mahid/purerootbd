import { NextResponse } from 'next/server';
import { getAdminPassword, getAdminSessionToken } from '@/lib/supabaseServer';

export async function POST(request) {
  const { password } = await request.json().catch(() => ({}));
  const expected = getAdminPassword();
  if (!expected || !password || password !== expected) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }

  const token = getAdminSessionToken();
  if (!token) {
    return NextResponse.json({ error: 'Admin session could not be created.' }, { status: 500 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set('pr_admin', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 12
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set('pr_admin', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0
  });
  return response;
}
