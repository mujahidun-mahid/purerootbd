"use client";
import { useEffect, useState } from "react";
import { useStore } from "@/components/StoreProvider";
import Link from "next/link";
import { ShieldCheck, Truck, CreditCard, Building2, Smartphone } from "lucide-react";

export default function Payment() {
  const { cart, total, clearCart, saveOrderLocally, hydrated } = useStore();
  const [method, setMethod] = useState("cod");
  const [state, setState] = useState("");
  const [error, setError] = useState("");
  const [customer, setCustomer] = useState(null);
  const delivery = total >= 2000 || total === 0 ? 0 : 80;

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("pr-checkout");
      setCustomer(raw ? JSON.parse(raw) : null);
    } catch {}
  }, []);

  async function pay() {
    if (!cart.length) {
      location.href = "/cart";
      return;
    }
    if (!customer?.name || !customer?.phone) {
      setError("Your delivery information is missing. Please return to checkout to complete it.");
      return;
    }

    setState("processing");
    setError("");

    try {
      const orderNumber = `PR-${Math.floor(10000000 + Math.random() * 90000000)}`;
      const payload = {
        order_number: orderNumber,
        customer,
        items: cart,
        subtotal: total,
        delivery_fee: delivery,
        total: total + delivery,
        payment_method: method
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Order placement failed. Please verify database connection.");
      }

      const savedOrder = data.order || payload;
      const orderSummary = {
        order: savedOrder.order_number || savedOrder.order || orderNumber,
        method,
        total: savedOrder.total,
        status: savedOrder.status || "Order Placed",
        date: savedOrder.placed_at ? new Date(savedOrder.placed_at).toLocaleDateString("en-BD") : new Date().toLocaleDateString("en-BD")
      };

      sessionStorage.setItem("pr-order", JSON.stringify(orderSummary));
      saveOrderLocally(savedOrder);
      clearCart();

      location.href = `/order-confirmation?order=${encodeURIComponent(orderSummary.order)}`;
    } catch (e) {
      setState("");
      setError(e.message || "Could not place order. Please check database configuration.");
    }
  }

  if (hydrated && !cart.length) {
    return (
      <section className="section">
        <div className="container" style={{ textAlign: "center", padding: "60px 20px" }}>
          <h2>Your cart is empty</h2>
          <p className="muted">Add some pure nutrition items to proceed with payment.</p>
          <Link className="btn btn-primary" href="/shop" style={{ marginTop: 15 }}>
            Go to Shop
          </Link>
        </div>
      </section>
    );
  }

  return (
    <>
      <div className="page-head">
        <div className="container">
          <div className="crumb">Checkout / Payment</div>
          <h1>Choose Payment Method</h1>
          <p className="muted">Your order details are securely sent to our order processing system.</p>
        </div>
      </div>
      <section className="section">
        <div className="container cart-layout">
          <div>
            {error && (
              <div className="notice error-notice" style={{ color: "var(--danger)", marginBottom: 15 }}>
                {error}
              </div>
            )}

            {[
              ["cod", "Cash on Delivery", "Pay in cash when your fresh products arrive at your doorstep."],
              ["bkash", "bKash Payment", "Send payment to our official merchant account (Order recorded as Awaiting Verification)."],
              ["nagad", "Nagad Payment", "Send payment to our official merchant account (Order recorded as Awaiting Verification)."],
              ["bank", "Bank Transfer", "Direct bank transfer to our corporate account (Account details shown upon order)."]
            ].map(([id, title, desc]) => (
              <div
                key={id}
                className={`payment-option ${method === id ? "selected" : ""}`}
                onClick={() => setMethod(id)}
                style={{ cursor: "pointer" }}
              >
                <input type="radio" checked={method === id} onChange={() => setMethod(id)} />
                <div>
                  <strong>{title}</strong>
                  <div className="muted">{desc}</div>
                </div>
              </div>
            ))}

            {method === "bkash" && (
              <div className="notice" style={{ marginTop: 14 }}>
                <strong>bKash Merchant Instruction:</strong> Your order will be stored in our database. Once placed, send the order total to our official bKash Merchant number with your Order Number as the reference.
              </div>
            )}
            {method === "nagad" && (
              <div className="notice" style={{ marginTop: 14 }}>
                <strong>Nagad Instruction:</strong> Your order will be stored in our database. Send payment to our official Nagad number using your Order Number as reference.
              </div>
            )}
            {method === "bank" && (
              <div className="notice" style={{ marginTop: 14 }}>
                <strong>Bank Transfer Instruction:</strong> Your order will be saved as Awaiting Bank Payment. Our team will verify and confirm once transfer is completed.
              </div>
            )}

            <button
              className="btn btn-primary"
              style={{ marginTop: 22, width: "100%", maxWidth: 320 }}
              onClick={pay}
              disabled={state === "processing"}
            >
              {state === "processing" ? "Storing Order…" : method === "cod" ? "Place COD Order" : `Place ${method.toUpperCase()} Order`}
            </button>
          </div>

          <aside className="summary">
            <h3>Payment Summary</h3>
            <div className="sumline">
              <span>Subtotal</span>
              <span>৳{total.toLocaleString()}</span>
            </div>
            <div className="sumline">
              <span>Delivery</span>
              <span>{delivery ? "৳" + delivery : "Free"}</span>
            </div>
            <div className="sumline sumtotal">
              <span>Total</span>
              <span>৳{(total + delivery).toLocaleString()}</span>
            </div>
            {customer && (
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--border)", fontSize: 12 }}>
                <div className="muted">Delivering to:</div>
                <strong>{customer.name}</strong> ({customer.phone})
                <div className="muted" style={{ marginTop: 4 }}>
                  {customer.address}, {customer.area || customer.district}
                </div>
              </div>
            )}
          </aside>
        </div>
      </section>
    </>
  );
}
