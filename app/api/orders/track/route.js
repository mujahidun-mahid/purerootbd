import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseServer';
import { redactOrderForTracking } from '@/lib/orderPrivacy';

export const dynamic = 'force-dynamic';

function normalizePhone(value) {
  return String(value || '').replace(/\D/g, '').replace(/^880/, '0');
}

export async function POST(request) {
  try {
    const { order_number, phone } = await request.json().catch(() => ({}));
    if (!order_number && !phone) {
      return NextResponse.json({ error: 'Please provide either an order number or mobile number.' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: 'Database is not configured.' }, { status: 503 });
    }

    let query = supabase.from('orders').select('*');

    if (order_number && phone) {
      query = query.eq('order_number', order_number.trim()).eq('phone', normalizePhone(phone));
    } else if (order_number) {
      query = query.eq('order_number', order_number.trim());
    } else if (phone) {
      query = query.eq('phone', normalizePhone(phone)).order('placed_at', { ascending: false });
    }

    const { data, error } = await query.limit(10);
    if (error || !data || !data.length) {
      return NextResponse.json({ error: 'No matching orders found.' }, { status: 404 });
    }

    const phoneVerified = Boolean(phone && normalizePhone(phone));
    const shape = (row) => (phoneVerified ? row : redactOrderForTracking(row));
    const primaryOrder = shape(data[0]);

    // Fetch status history for this order
    const { data: history } = await supabase
      .from('order_status_history')
      .select('status,changed_at')
      .eq('order_id', data[0].id)
      .order('changed_at', { ascending: true });

    return NextResponse.json({
      order: primaryOrder,
      orders: phoneVerified ? data : [primaryOrder],
      history: history || []
    });
  } catch (e) {
    console.error('Order tracking error:', e);
    return NextResponse.json({ error: e.message || 'Unable to track order' }, { status: 500 });
  }
}
