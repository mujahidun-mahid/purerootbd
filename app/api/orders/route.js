import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { getSupabaseAdmin, getSupabaseConfig } from '@/lib/supabaseServer';
import { redactOrderForTracking } from '@/lib/orderPrivacy';
import { safeError, NO_STORE, bodyTooLarge, tooLargeResponse, throttle } from '@/lib/apiSecurity';

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
    const limited = throttle(request, { windowMs: 60_000, max: 30, key: 'orders-post' });
    if (limited) return limited;
    if (bodyTooLarge(request, 512 * 1024)) return tooLargeResponse(512 * 1024);
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
    if (name.length > 120 || phone.length > 20 || address.length > 1000) {
      return NextResponse.json({ error: 'One or more delivery fields are too long.' }, { status: 400 });
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

    // Accept a client retry key only when it is a sane, bounded value.
    // Otherwise generate a cryptographically random order number.
    const requestedOrder = String(body.order || body.order_number || '').trim();
    if (requestedOrder && !/^[A-Za-z0-9-]{4,40}$/.test(requestedOrder)) {
      return NextResponse.json({ error: 'Invalid order number.' }, { status: 400 });
    }
    const orderNumber = requestedOrder || `PR-${crypto.randomInt(10000000, 100000000)}`;

    // Idempotency: retried submissions with the same order number AND phone
    // return the original order. Never return another customer's order when
    // only the (enumerable) order number matches.
    const { data: existing } = await supabase
      .from('orders')
      .select('*')
      .eq('order_number', String(orderNumber).trim())
      .maybeSingle();
    if (existing) {
      if (normalizePhone(existing.phone) !== phone) {
        return NextResponse.json(
          { error: 'That order number is already in use.' },
          { status: 409 }
        );
      }
      return NextResponse.json({
        order: { ...existing, order: existing.order_number, method: existing.payment_method },
        duplicate: true
      }, { headers: NO_STORE });
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
      return safeError(error, 'Could not save the order right now.');
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
    }, { status: 201, headers: NO_STORE });
  } catch (error) {
    return safeError(error, 'Unable to create order right now.');
  }
}

export async function GET(request) {
  try {
    const limited = throttle(request, { windowMs: 60_000, max: 30, key: 'orders-get' });
    if (limited) return limited;

    const supabase = getSupabaseAdmin();
    if (!supabase) return NextResponse.json({ error: 'Database is not configured.' }, { status: 503 });

    const searchParams = request.nextUrl.searchParams;
    const rawPhone = searchParams.get('phone');
    const rawOrder = searchParams.get('order');
    const cleanPhone = rawPhone ? normalizePhone(rawPhone) : '';
    const orderNumber = rawOrder ? rawOrder.trim() : '';

    if (!cleanPhone && !orderNumber) {
      return NextResponse.json({ error: 'phone or order parameter required' }, { status: 400 });
    }
    if (cleanPhone && cleanPhone.replace(/\D/g, '').length < 10) {
      return NextResponse.json({ error: 'A valid phone number is required.' }, { status: 400 });
    }
    if (orderNumber && orderNumber.length > 40) {
      return NextResponse.json({ error: 'Invalid order number.' }, { status: 400 });
    }

    let query = supabase.from('orders').select('*').order('placed_at', { ascending: false });
    if (cleanPhone && orderNumber) {
      query = query.eq('phone', cleanPhone).eq('order_number', orderNumber);
    } else if (cleanPhone) {
      query = query.eq('phone', cleanPhone);
    } else {
      query = query.eq('order_number', orderNumber);
    }

    const { data, error } = await query.limit(50);
    if (error) throw error;

    // This endpoint is public and is used by the order-confirmation page.
    // Always return the redacted tracking shape: even a phone number is low
    // entropy and must not unlock names and delivery addresses over an
    // unauthenticated GET request.
    const formatted = (data || []).map(redactOrderForTracking);

    return NextResponse.json({ orders: formatted }, { headers: NO_STORE });
  } catch (error) {
    return safeError(error, 'Unable to retrieve orders.');
  }
}

export async function PATCH(request) {
  try {
    const limited = throttle(request, { windowMs: 60_000, max: 15, key: 'orders-cancel' });
    if (limited) return limited;
    if (bodyTooLarge(request, 64 * 1024)) return tooLargeResponse(64 * 1024);
    const body = await request.json().catch(() => ({}));
    const { order_number, phone, status } = body;

    if (!order_number || !phone) {
      return NextResponse.json({ error: 'Order number and phone are required.' }, { status: 400 });
    }
    if (String(order_number).trim().length > 40) {
      return NextResponse.json({ error: 'Invalid order number.' }, { status: 400 });
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

    // The tracking page reloads after cancellation; it does not need the
    // customer's name/address back from this public endpoint.
    return NextResponse.json({ order: redactOrderForTracking(updated) }, { headers: NO_STORE });
  } catch (error) {
    return safeError(error, 'Unable to cancel order.');
  }
}