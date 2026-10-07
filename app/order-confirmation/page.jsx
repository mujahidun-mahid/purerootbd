"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2, Truck, ShoppingBag } from "lucide-react";

export default function Confirmation() {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const queryOrder = new URLSearchParams(window.location.search).get("order");
        const raw = sessionStorage.getItem("pr-order");
        const saved = raw ? JSON.parse(raw) : null;

        if (queryOrder && saved && (saved.order === queryOrder || saved.order_number === queryOrder)) {
          setOrder(saved);
          setLoading(false);
          return;
        }

        if (queryOrder) {
          const res = await fetch(`/api/orders?order=${encodeURIComponent(queryOrder)}`);
          if (res.ok) {
            const data = await res.json();
            if (data.orders && data.orders[0]) {
              setOrder(data.orders[0]);
              setLoading(false);
              return;
            }
          }
        }

        setOrder(saved);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 680 }}>
        <div className="confirmation-card" style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 24, padding: '40px 24px', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.04)' }}>
          {loading ? (
            <div style={{ padding: 40 }}>Loading order confirmation…</div>
          ) : order ? (
            <>
              <div style={{ width: 68, height: 68, borderRadius: '50%', background: '#eaf6ec', color: 'var(--green)', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}>
                <CheckCircle2 size={40} />
              </div>
              <div className="kicker">Thank you for choosing Pure Roots</div>
              <h1 style={{ color: "var(--dark)", margin: "8px 0 12px", fontSize: 32 }}>Order Confirmed!</h1>
              <p className="muted" style={{ maxWidth: 460, margin: "0 auto 24px", fontSize: 14 }}>
                Your order has been recorded in our system. You can track fulfillment and delivery progress in real time.
              </p>

              <div className="notice" style={{ maxWidth: 520, margin: "0 auto 26px", textAlign: "left", background: "#f8faf8", border: "1px solid #dbe6dd", borderRadius: 14, padding: 18 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
                  <div>
                    <span className="muted" style={{ display: 'block', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>Order Number</span>
                    <strong>{order.order || order.order_number}</strong>
                  </div>
                  <div>
                    <span className="muted" style={{ display: 'block', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>Status</span>
                    <strong style={{ color: 'var(--green)' }}>{order.status || 'Order Placed'}</strong>
                  </div>
                  <div>
                    <span className="muted" style={{ display: 'block', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>Payment Method</span>
                    <strong>{order.payment_method === 'cod' ? 'Cash on Delivery' : order.payment_method || order.method || 'COD'}</strong>
                  </div>
                  <div>
                    <span className="muted" style={{ display: 'block', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>Total Amount</span>
                    <strong style={{ fontSize: 16 }}>৳{Number(order.total || 0).toLocaleString()}</strong>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                <Link className="btn btn-primary" href="/track-order">
                  <Truck size={16} /> Track Order Live
                </Link>
                <Link className="btn btn-outline" href="/shop">
                  <ShoppingBag size={16} /> Continue Shopping
                </Link>
              </div>
            </>
          ) : (
            <div style={{ padding: 20 }}>
              <h2>No Recent Order Found</h2>
              <p className="muted">You haven't placed an order recently in this session.</p>
              <Link className="btn btn-primary" href="/shop" style={{ marginTop: 14 }}>
                Start Shopping
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
