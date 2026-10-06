import { NextResponse } from 'next/server';
import { getSupabaseAdmin, adminAuthorized } from '@/lib/supabaseServer';

export async function GET(request) {
  if (!adminAuthorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from('orders').select('*').order('placed_at', { ascending: false }).limit(500);
    if (error) throw error;
    return NextResponse.json({ orders: data || [] });
  } catch (error) {
    console.error('Admin orders error', error);
    return NextResponse.json({ error: error.message || 'Unable to load orders' }, { status: 500 });
  }
}

export async function PATCH(request) {
  if (!adminAuthorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json();
    if (!body.id || !body.status) return NextResponse.json({ error: 'id and status are required' }, { status: 400 });
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from('orders').update({ status: body.status }).eq('id', body.id).select().single();
    if (error) throw error;
    await supabase.from('order_status_history').insert({ order_id: body.id, status: body.status });
    return NextResponse.json({ order: data });
  } catch (error) {
    console.error('Admin order update error', error);
    return NextResponse.json({ error: error.message || 'Unable to update order' }, { status: 500 });
  }
}
