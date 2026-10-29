import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseServer';
import { redactOrderForTracking } from '@/lib/orderPrivacy';
import { safeError, NO_STORE, bodyTooLarge, tooLargeResponse, throttle } from '@/lib/apiSecurity';

export const dynamic = 'force-dynamic';

function normalizePhone(value) {
  return String(value || '').replace(/\D/g, '').replace(/^880/, '0');
}

export async function POST(request) {
  try {
    const limited = throttle(request, { windowMs: 60_000, max: 30, key: 'orders-track' });
    if (limited) return limited;
    if (bodyTooLarge(request, 64 * 1024)) return tooLargeResponse(64 * 1024);
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

    // Full customer details require BOTH the order number and the matching
    // phone. A phone-only lookup may return several orders, so those are
    // redacted; the tracking UI only needs status/totals/items for that view.
    const phoneVerified = Boolean(order_number && phone && normalizePhone(phone));
    const shape = (row) => (phoneVerified ? row : redactOrderForTracking(row));
    const shapedOrders = data.map(shape);
    const primaryOrder = shapedOrders[0];

    // Fetch status history for this order
    const { data: history } = await supabase
      .from('order_status_history')
      .select('status,changed_at')
      .eq('order_id', data[0].id)
      .order('changed_at', { ascending: true });

    return NextResponse.json({
      order: primaryOrder,
      orders: shapedOrders,
      history: history || []
    }, { headers: NO_STORE });
  } catch (e) {
    return safeError(e, 'Unable to track order.');
  }
}
