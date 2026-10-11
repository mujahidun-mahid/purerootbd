// Order-number-only lookups must not leak customer PII. Order numbers
// (PR-XXXXXXXX) are low-entropy and enumerable, so anyone guessing one
// would otherwise harvest names, phones and delivery addresses.
// With a verified phone number the full record is returned; without it,
// only the fulfillment-facing fields needed for tracking are exposed.
export function redactOrderForTracking(row) {
  return {
    order_number: row.order_number,
    order: row.order_number,
    status: row.status,
    payment_status: row.payment_status || 'pending',
    payment_method: row.payment_method,
    method: row.payment_method,
    subtotal: Number(row.subtotal || 0),
    delivery_fee: Number(row.delivery_fee || 0),
    delivery: Number(row.delivery_fee || 0),
    total: Number(row.total || 0),
    items: (Array.isArray(row.items) ? row.items : []).map((it) => ({
      name: it.name,
      size: it.size,
      qty: it.qty,
      price: it.price,
    })),
    placed_at: row.placed_at,
    updated_at: row.updated_at,
    date: row.placed_at ? new Date(row.placed_at).toLocaleDateString('en-BD') : null,
  };
}
