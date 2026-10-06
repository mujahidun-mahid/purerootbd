import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseServer';

export async function POST(request) {
  try {
    const body = await request.json();
    if (!body.customer?.name || !body.customer?.phone || !body.items?.length) {
      return NextResponse.json({ error: 'Missing order information' }, { status: 400 });
    }
    const supabase = getSupabaseAdmin();
    const orderNumber = body.order_number || `PR-${Date.now().toString().slice(-8)}`;
    const { data, error } = await supabase.from('orders').insert({
      order_number: orderNumber,
      phone: String(body.customer.phone),
      customer: body.customer,
      items: body.items,
      payment_method: body.payment_method || 'cod',
      subtotal: Number(body.subtotal || 0),
      delivery_fee: Number(body.delivery_fee || 0),
      total: Number(body.total || 0),
      status: 'Order Placed'
    }).select().single();
    if (error) throw error;
    await supabase.from('order_status_history').insert({ order_id: data.id, status: 'Order Placed' });
    return NextResponse.json({ order: data });
  } catch (error) {
    console.error('Order creation error', error);
    return NextResponse.json({ error: error.message || 'Unable to create order' }, { status: 500 });
  }
}
