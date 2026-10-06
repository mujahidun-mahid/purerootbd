import { NextResponse } from 'next/server';
import crypto from 'node:crypto';

export async function POST(request) {
  const { password } = await request.json().catch(() => ({}));
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || !password || password !== expected) return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  const token = crypto.createHash('sha256').update(`${expected}:${process.env.NEXT_PUBLIC_SUPABASE_URL || ''}`).digest('hex');
  const response = NextResponse.json({ ok: true });
  response.cookies.set('pr_admin', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/', maxAge: 60 * 60 * 12 });
  return response;
}
