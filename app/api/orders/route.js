import { NextResponse } from 'next/server';
import { getSupabaseAdmin, getSupabaseConfig } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

function normalizePhone(value) {
  return String(value || '').replace(/\D/g, '').replace(/^880/, '0');
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const customer = body.customer || {};
    const items = Array.isArray(body.items) ? body.items : [];

    const name = String(customer.name || '').trim();
    const phone = normalizePhone(customer.phone);
    const address = String(customer.address || '').trim();

    if (!name) {
      return NextResponse.json({ error: 'Customer name is required.' }, { status: 400 });
    }
    if (!phone) {
      return NextResponse.json({ error: 'Valid phone number is required.' }, { status: 400 });
    }
    if (!items.length) {
      return NextResponse.json({ error: 'Order must contain at least one item.' }, { status: 400 });
    }

    const config = getSupabaseConfig();
    if (!config.configured) {
      console.error('Supabase credentials missing during order checkout');
      return NextResponse.json({ 
        error: 'Database is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment.' 
      }, { status: 503 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: 'Failed to initialize database connection.' }, { status: 500 });
    }

    const orderNumber = body.order || body.order_number || `PR-${Math.floor(10000000 + Math.random() * 90000000)}`;
    const subtotal = Number(body.subtotal || 0);
    const deliveryFee = Number(body.delivery_fee ?? body.delivery ?? (subtotal >= 2000 ? 0 : 80));
    const total = Number(body.total || (subtotal + deliveryFee));
    const paymentMethod = body.payment_method || body.method || 'cod';

    let initialStatus = body.status || 'Order Placed';
    if (!body.status) {
      if (paymentMethod === 'cod') initialStatus = 'Order Placed';
      else if (paymentMethod === 'bank') initialStatus = 'Awaiting Bank Transfer';
      else initialStatus = 'Awaiting Payment';
    }

    const sanitizedCustomer = {
      name,
      phone,
      email: String(customer.email || '').trim(),
      address,
      division: String(customer.division || '').trim(),
      district: String(customer.district || '').trim(),
      upazila: String(customer.upazila || '').trim(),
      area: String(customer.area || '').trim(),
      postal: String(customer.postal || '').trim(),
      notes: String(customer.notes || '').trim()
    };

    const sanitizedItems = items.map((x, idx) => ({
      key: x.key || `${x.productId || x.slug || x.name || idx}-${x.size || '500g'}`,
      productId: x.productId || x.id || '',
      slug: x.slug || '',
      name: x.name || 'Pure Roots Product',
      size: x.size || '500g',
      price: Number(x.price || 0),
      qty: Math.max(1, Number(x.qty || 1)),
      imageType: x.imageType || x.category || 'nuts',
      image: x.image || ''
    }));

    const orderRow = {
      order_number: orderNumber,
      phone,
      customer: sanitizedCustomer,
      items: sanitizedItems,
      payment_method: paymentMethod,
      subtotal,
      delivery_fee: deliveryFee,
      total,
      status: initialStatus,
      placed_at: body.createdAt || new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('orders')
      .insert(orderRow)
      .select()
      .single();

    if (error) {
      console.error('Supabase order insert error details:', error);
      return NextResponse.json({ 
        error: `Database write failed: ${error.message || 'Check database permissions or schema.'}` 
      }, { status: 500 });
    }

    // Insert order status history entry
    const { error: historyError } = await supabase.from('order_status_history').insert({
      order_id: data.id,
      status: initialStatus
    });
    if (historyError) {
      console.warn('Status history logging warning:', historyError.message);
    }

    return NextResponse.json({ 
      order: {
        ...data,
        order: data.order_number,
        method: data.payment_method,
        date: new Date(data.placed_at).toLocaleDateString('en-BD')
      } 
    }, { status: 201 });
  } catch (error) {
    console.error('Order creation general error:', error);
    return NextResponse.json({ error: error.message || 'Unable to create order right now.' }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) return NextResponse.json({ error: 'Database is not configured.' }, { status: 503 });

    const searchParams = new URL(request.url).searchParams;
    const phone = searchParams.get('phone');
    const orderNumber = searchParams.get('order');

    let query = supabase.from('orders').select('*').order('placed_at', { ascending: false });

    if (phone) {
      const cleanPhone = normalizePhone(phone);
      query = query.eq('phone', cleanPhone);
    } else if (orderNumber) {
      query = query.eq('order_number', orderNumber.trim());
    } else {
      return NextResponse.json({ error: 'phone or order parameter required' }, { status: 400 });
    }

    const { data, error } = await query.limit(50);
    if (error) throw error;

    const formatted = (data || []).map(row => ({
      id: row.id,
      order: row.order_number,
      order_number: row.order_number,
      phone: row.phone,
      method: row.payment_method,
      payment_method: row.payment_method,
      subtotal: Number(row.subtotal || 0),
      delivery: Number(row.delivery_fee || 0),
      delivery_fee: Number(row.delivery_fee || 0),
      total: Number(row.total || 0),
      status: row.status,
      customer: row.customer,
      items: row.items,
      date: new Date(row.placed_at).toLocaleDateString('en-BD'),
      placed_at: row.placed_at,
      updated_at: row.updated_at
    }));

    return NextResponse.json({ orders: formatted });
  } catch (error) {
    console.error('Orders query error:', error);
    return NextResponse.json({ error: error.message || 'Unable to retrieve orders.' }, { status: 500 });
  }
}
