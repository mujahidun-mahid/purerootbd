import { NextResponse } from 'next/server';
import { getSupabaseAdmin, adminAuthorized } from '@/lib/supabaseServer';
import { getAdminDashboardData } from '@/lib/adminDashboard';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  if (!adminAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await getAdminDashboardData();
    if (data.error) {
      return NextResponse.json(data, { status: data.configured ? 500 : 503 });
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error('Admin orders GET error:', error);
    return NextResponse.json({ error: error.message || 'Unable to load orders' }, { status: 500 });
  }
}

export async function PATCH(request) {
  if (!adminAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    if (!body.id || !body.status) {
      return NextResponse.json({ error: 'Order ID and status are required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    const status = String(body.status).trim();
    if (!status) {
      return NextResponse.json({ error: 'Order ID and status are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', body.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
      }
      if (error.code === '22P02') {
        return NextResponse.json({ error: 'Invalid order id.' }, { status: 400 });
      }
      throw error;
    }

    // Record status history change
    const { error: historyError } = await supabase.from('order_status_history').insert({
      order_id: body.id,
      status
    });
    if (historyError) {
      console.warn('Status history insert error:', historyError.message);
    }

    return NextResponse.json({ order: data });
  } catch (error) {
    console.error('Admin order update error:', error);
    return NextResponse.json({ error: error.message || 'Unable to update order' }, { status: 500 });
  }
}
