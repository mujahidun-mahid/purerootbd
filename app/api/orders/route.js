import { NextResponse } from 'next/server';
import { getSupabaseAdmin, getSupabaseConfig } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

function normalizePhone(value) {
  return String(value || '').replace(/\D/g, '').replace(/^880/, '0');
}

const CANCELLABLE_STATUSES = new Set([
  'order placed',
  'awaiting payment',
  'awaiting bank transfer',
  'order confirmed'
]);

function isCancellable(status) {
  return CANCELLABLE_STATUSES.has(String(status || '').toLowerCase());
}

const ALLOWED_PAYMENT_METHODS = new Set(['cod', 'bkash', 'nagad', 'bank']);

async function getDeliveryPolicy(supabase) {
  let fee = 80;
  let threshold = 2000;
  try {
    const { data } = await supabase
      .from('site_settings')
      .select('key,value')
      .in('key', ['delivery_fee_default', 'free_delivery_threshold']);
    for (const row of data || []) {
      if (row.key === 'delivery_fee_default' && Number(row.value) >= 0) fee = Number(row.value);
      if (row.key === 'free_delivery_threshold' && Number(row.value) >= 0) threshold = Number(row.value);
    }
  } catch {}
  return { fee, threshold };
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const customer = body.customer || {};
    const items = Array.isArray(body.items) ? body.items : [];

    const name = String(customer.name || '').trim();
    const phone = normalizePhone(customer.phone);
    const address = String(customer.address || '').trim();
    const paymentMethod = body.payment_method || body.method || 'cod';

    if (!name) {
      return NextResponse.json({ error: 'Customer name is required.' }, { status: 400 });
    }
    if (!phone || phone.replace(/\D/g, '').length < 10) {
      return NextResponse.json({ error: 'Valid phone number is required.' }, { status: 400 });
    }
    if (!address) {
      return NextResponse.json({ error: 'Delivery address is required.' }, { status: 400 });
    }
    if (!ALLOWED_PAYMENT_METHODS.has(paymentMethod)) {
      return NextResponse.json({ error: 'Unsupported payment method.' }, { status: 400 });
    }
    if (!items.length) {
      return NextResponse.json({ error: 'Order must contain at least one item.' }, { status: 400 });
    }
    if (items.length > 100) {
      return NextResponse.json({ error: 'Too many items in a single order.' }, { status: 400 });
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

    // Idempotency: retried submissions with the same order number
    // return the original order instead of creating a duplicate.
    const { data: existing } = await supabase
      .from('orders')
      .select('*')
      .eq('order_number', String(orderNumber).trim())
      .maybeSingle();
    if (existing) {
      return NextResponse.json({
        order: { ...existing, order: existing.order_number, method: existing.payment_method },
        duplicate: true
      });
    }

    // Server-side catalog verification: every line must match a real,
    // active product at its real package price, within available stock.
    const { data: catalog, error: catalogError } = await supabase
      .from('products')
      .select('id,slug,name,price,stock,packages,active');
    if (catalogError) throw catalogError;
    const bySlug = new Map((catalog || []).map((p) => [String(p.slug || '').toLowerCase(), p]));
    const byId = new Map((catalog || []).map((p) => [String(p.id || ''), p]));

    let subtotal = 0;
    const sanitizedItems = [];
    for (const x of items) {
      const qty = Math.max(1, Math.min(99, Number(x.qty || 1)));
      const ref = bySlug.get(String(x.slug || '').toLowerCase()) || byId.get(String(x.productId || x.id || ''));
      if (!ref || ref.active === false) {
        return NextResponse.json({ error: `Product "${x.name || x.slug || 'unknown'}" is not available.` }, { status: 400 });
      }
      const size = String(x.size || '500g');
      const pkg = Array.isArray(ref.packages) && ref.packages.length
        ? ref.packages.find((p) => String(p.size) === size) || ref.packages[0]
        : { size, price: ref.price };
      const unitPrice = Number(pkg.price ?? ref.price ?? 0);
      if (!(unitPrice > 0)) {
        return NextResponse.json({ error: `Product "${ref.name}" has no valid price.` }, { status: 400 });
      }
      if (ref.stock !== null && ref.stock !== undefined && Number(ref.stock) < qty) {
        return NextResponse.json({ error: `Only ${ref.stock} × ${ref.name} left in stock.` }, { status: 400 });
      }
      subtotal += unitPrice * qty;
      sanitizedItems.push({
        key: x.key || `${ref.id}-${pkg.size}`,
        productId: ref.id,
        slug: ref.slug,
        name: ref.name,
        size: pkg.size,
        price: unitPrice,
        qty,
        imageType: x.imageType || x.category || 'nuts',
        image: x.image || ''
      });
    }
    subtotal = Math.round(subtotal * 100) / 100;

    const { fee: deliveryDefault, threshold: freeThreshold } = await getDeliveryPolicy(supabase);
    const deliveryFee = subtotal <= 0 ? 0 : subtotal >= freeThreshold ? 0 : deliveryDefault;
    const total = Math.round((subtotal + deliveryFee) * 100) / 100;

    // Order status follows fulfillment; payment is NEVER marked paid here.
    // Online methods stay pending until a verified provider callback arrives.
    let initialStatus;
    if (paymentMethod === 'cod') initialStatus = 'Order Placed';
    else if (paymentMethod === 'bank') initialStatus = 'Awaiting Bank Transfer';
    else initialStatus = 'Awaiting Payment';

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

    const orderRow = {
      order_number: String(orderNumber).trim(),
      phone,
      customer: sanitizedCustomer,
      items: sanitizedItems,
      payment_method: paymentMethod,
      payment_status: 'pending',
      subtotal,
      delivery_fee: deliveryFee,
      total,
      status: initialStatus,
      placed_at: new Date().toISOString()
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

    const searchParams = request.nextUrl.searchParams;
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
      payment_status: row.payment_status || 'pending',
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

export async function PATCH(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { order_number, phone, status } = body;

    if (!order_number || !phone) {
      return NextResponse.json({ error: 'Order number and phone are required.' }, { status: 400 });
    }
    if (status !== 'Cancelled') {
      return NextResponse.json({ error: 'Only cancellation is supported.' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: 'Database is not configured.' }, { status: 503 });
    }

    const cleanPhone = normalizePhone(phone);
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('id, status')
      .eq('order_number', order_number.trim())
      .eq('phone', cleanPhone)
      .single();

    if (fetchError || !order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    if (!isCancellable(order.status)) {
      return NextResponse.json({ error: `Order cannot be cancelled (current status: ${order.status}).` }, { status: 400 });
    }

    const { data: updated, error: updateError } = await supabase
      .from('orders')
      .update({ status: 'Cancelled', updated_at: new Date().toISOString() })
      .eq('id', order.id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Record status history
    const { error: historyError } = await supabase
      .from('order_status_history')
      .insert({ order_id: order.id, status: 'Cancelled' });
    if (historyError) console.warn('Status history insert error:', historyError.message);

    return NextResponse.json({ order: updated });
  } catch (error) {
    console.error('Order cancellation error:', error);
    return NextResponse.json({ error: error.message || 'Unable to cancel order' }, { status: 500 });
  }
}