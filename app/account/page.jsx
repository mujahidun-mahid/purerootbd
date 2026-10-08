"use client";
import Link from "next/link";
import { Package, ArrowRight, Phone, ShoppingBag } from "lucide-react";
import { useStore } from "@/components/StoreProvider";

export default function Account() {
  const { orders } = useStore();

  return (
    <>
      <div className="page-head">
        <div className="container">
          <div className="crumb">Account / Orders</div>
          <h1>My Orders</h1>
          <p className="muted">Your recent purchases saved on this device.</p>
        </div>
      </div>
      <section className="section">
        <div className="container account-layout">
          <div>
            <div className="account-head">
              <div>
                <div className="kicker">Purchase history</div>
                <h2 style={{ margin: '4px 0 0' }}>Recent Orders</h2>
              </div>
              <Link className="btn btn-outline" href="/shop">
                <ShoppingBag size={16} /> Shop More
              </Link>
            </div>

            {orders && orders.length > 0 ? (
              <div className="order-list" style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 18, padding: 18 }}>
                {orders.map((o) => (
                  <article
                    className="order-card"
                    key={o.order || o.order_number}
                  >
                    <div>
                      <strong>{o.order || o.order_number}</strong>
                      <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                        {o.date || new Date().toLocaleDateString('en-BD')} • {o.payment_method === 'cod' ? 'Cash on Delivery' : o.payment_method || 'COD'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <strong>৳{Number(o.total || 0).toLocaleString()}</strong>
                      <div style={{ fontSize: 12, color: 'var(--green)', fontWeight: 700, marginTop: 4 }}>
                        {o.status || 'Order Placed'}
                      </div>
                    </div>
                    <Link className="btn btn-outline" style={{ padding: '8px 12px', fontSize: 12 }} href={`/track-order?order=${encodeURIComponent(o.order || o.order_number)}`}>
                      Track <ArrowRight size={14} />
                    </Link>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty" style={{ background: '#fff', border: '1px dashed var(--border)', borderRadius: 18, padding: '50px 20px', textAlign: 'center' }}>
                <ShoppingBag size={32} style={{ margin: '0 auto 12px', color: 'var(--green)' }} />
                <h3>No Orders Yet</h3>
                <p className="muted">Orders placed on this device will be listed here.</p>
                <Link className="btn btn-primary" href="/shop" style={{ marginTop: 12 }}>
                  Start Shopping
                </Link>
              </div>
            )}
          </div>

          <aside className="account-side" style={{ background: '#f8faf8', border: '1px solid var(--border)', borderRadius: 18, padding: 22 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: '#edf7ef', color: 'var(--green)', display: 'grid', placeItems: 'center', marginBottom: 12 }}>
              <Phone size={20} />
            </div>
            <div className="kicker">Quick Tracking</div>
            <h3 style={{ margin: '6px 0 10px', fontSize: 18 }}>Track by Phone Number</h3>
            <p className="muted" style={{ fontSize: 13, lineHeight: 1.6 }}>
              No login or password required. Use the mobile number from checkout to instantly view all your orders and delivery statuses.
            </p>
            <Link className="btn btn-primary btn-block" href="/track-order" style={{ marginTop: 14 }}>
              Track Any Order
            </Link>
          </aside>
        </div>
      </section>
    </>
  );
}
