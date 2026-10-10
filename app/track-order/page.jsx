"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, PackageCheck, Truck, CheckCircle2, Clock3, ChevronRight, X } from "lucide-react";

const steps = ["Order Placed", "Order Confirmed", "Processing", "Packed", "Shipped", "Out for Delivery", "Delivered"];

const indexForStatus = (status) => {
  const s = String(status || '').toLowerCase();
  if (s.includes('deliver')) return 6;
  if (s.includes('out for')) return 5;
  if (s.includes('ship')) return 4;
  if (s.includes('pack')) return 3;
  if (s.includes('process')) return 2;
  if (s.includes('confirm')) return 1;
  return 0;
};

const normalizePhone = (value) => String(value || '').replace(/\D/g, '').replace(/^880/, '0');

const CANCELLABLE_STATUSES = new Set([
  'order placed',
  'awaiting payment',
  'awaiting bank transfer',
  'order confirmed'
]);

function isCancellable(status) {
  return CANCELLABLE_STATUSES.has(String(status || '').toLowerCase());
}

function StatusIcon({ status }) {
  if (status === "Delivered") return <CheckCircle2 size={18} />;
  if (["Shipped", "Out for Delivery"].includes(status)) return <Truck size={18} />;
  if (["Processing", "Packed"].includes(status)) return <PackageCheck size={18} />;
  return <Clock3 size={18} />;
}

export default function Track() {
  const [phone, setPhone] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [orders, setOrders] = useState([]);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(null);

  async function cancelOrder(orderNum, phoneNum) {
    if (!window.confirm('Cancel this order?')) return;
    setCancelling(orderNum);
    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ order_number: orderNum, phone: normalizePhone(phoneNum), status: 'Cancelled' })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to cancel');
      alert('Order cancelled.');
      window.location.reload();
    } catch (e) {
      alert(e.message);
    } finally {
      setCancelling(null);
    }
  }

  useEffect(() => {
    try {
      const savedPhone = sessionStorage.getItem("pr-track-phone");
      if (savedPhone) setPhone(savedPhone);
      const savedOrder = new URLSearchParams(location.search).get("order");
      if (savedOrder) setOrderNumber(savedOrder);
    } catch {}
  }, []);

  const searchOrders = async (e) => {
    if (e) e.preventDefault();
    if (!phone && !orderNumber) {
      setError("Please enter your mobile number or order number.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/orders/track", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          phone: phone ? normalizePhone(phone) : "",
          order_number: orderNumber ? orderNumber.trim() : ""
        })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "No orders found matching your search.");
      }

      const list = data.orders || (data.order ? [data.order] : []);
      setOrders(list);
      setHistory(data.history || []);
      setSearched(true);

      if (phone) {
        try {
          sessionStorage.setItem("pr-track-phone", normalizePhone(phone));
        } catch {}
      }
    } catch (err) {
      setOrders([]);
      setSearched(true);
      setError(err.message || "No orders found.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="page-head track-hero">
        <div className="container">
          <div className="crumb">Support / Tracking</div>
          <h1>Track Your Order</h1>
          <p className="muted">Enter either your mobile number or your order number to check real-time progress.</p>
        </div>
      </div>

      <section className="section">
        <div className="container track-wrap" style={{ maxWidth: 900 }}>
          <form onSubmit={searchOrders} className="tracking-form track-search-card" style={{ padding: 24, borderRadius: 20, background: '#fff', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: '#F1F7EF', color: 'var(--green)', display: 'grid', placeItems: 'center' }}>
                <Search size={20} />
              </div>
              <div>
                <h2 style={{ margin: '0 0 4px', fontSize: 20 }}>Live Order Tracking</h2>
                <p className="muted" style={{ margin: 0, fontSize: 13 }}>Instant status lookup from our database.</p>
              </div>
            </div>

            <div className="form-grid">
              <div>
                <label>Mobile Number</label>
                <input
                  className="input"
                  placeholder="01XXXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div>
                <label>Order Number (Optional)</label>
                <input
                  className="input"
                  placeholder="PR-12345678"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                />
              </div>
            </div>

            <button
              className="btn btn-primary"
              style={{ marginTop: 18, width: '100%', maxWidth: 240 }}
              type="submit"
              disabled={loading}
            >
              {loading ? "Checking Database…" : "Track Order"}
            </button>

            {error && (
              <div className="notice" style={{ marginTop: 18, color: 'var(--danger)', background: '#fff4f2', borderColor: '#f0c9c4' }}>
                {error}
              </div>
            )}
          </form>

          {searched && orders.length > 0 && (
            <div style={{ marginTop: 32 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={{ margin: 0 }}>Found {orders.length} Order{orders.length === 1 ? '' : 's'}</h2>
              </div>

              {orders.map((o) => {
                const active = indexForStatus(o.status);
                return (
                  <article key={o.id || o.order_number} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 18, padding: 24, marginBottom: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
                      <div>
                        <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--muted)', fontWeight: 700 }}>
                          ORDER ID
                        </span>
                        <h3 style={{ margin: '4px 0', fontSize: 22 }}>{o.order_number}</h3>
                        <p className="muted" style={{ margin: 0, fontSize: 13 }}>
                          Placed on {new Date(o.placed_at).toLocaleDateString('en-BD')} • Total: ৳{Number(o.total || 0).toLocaleString()}
                        </p>
                      </div>

                      <div className={`status-pill status-${String(o.status || '').toLowerCase().replaceAll(' ', '-')}`}>
                        <StatusIcon status={o.status} /> {o.status}
                      </div>
                    </div>

                    {/* TIMELINE */}
                    <div className="timeline" style={{ margin: '30px 0' }}>
                      {steps.map((s, i) => (
                        <div className={`step ${i <= active ? 'active' : ''}`} key={s}>
                          <div className="dot">{i <= active ? '✓' : i + 1}</div>
                          <span>{s}</span>
                        </div>
                      ))}
                    </div>

                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, fontSize: 13 }}>
                      <div>
                        <strong>{o.items?.length || 0} item{(o.items?.length || 0) === 1 ? '' : 's'}</strong> •{' '}
                        <span className="muted">{o.customer?.address || 'Delivery address on record'}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        {isCancellable(o.status) && (
                          <button
                            type="button"
                            className="btn btn-outline danger"
                            style={{ padding: '8px 14px', fontSize: 13 }}
                            onClick={() => cancelOrder(o.order_number, o.phone)}
                            disabled={cancelling === o.order_number}
                          >
                            {cancelling === o.order_number ? 'Cancelling…' : <><X size={14} /> Cancel</>}
                          </button>
                        )}
                        <Link className="btn btn-outline" style={{ padding: '8px 14px', fontSize: 13 }} href={`/order-confirmation?order=${encodeURIComponent(o.order_number)}`}>
                          View Order Details <ChevronRight size={14} />
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
