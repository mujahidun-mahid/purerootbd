"use client";
import { useEffect, useState } from "react";
import { useStore } from "@/components/StoreProvider";
import { useSiteSettings } from "@/components/SiteSettingsProvider";
import Link from "next/link";
import { Banknote, Building2, Lock } from "lucide-react";
import CheckoutSteps from "@/components/CheckoutSteps";

const PAYMENT_METHODS = [
  ["cod", "Cash on Delivery", "Pay when your order arrives at your doorstep.", null, null],
  ["bkash", "bKash Payment", "Pay using your bKash account and follow the payment instructions.", null, { text: "bKash", bg: "#E2136E" }],
  ["nagad", "Nagad Payment", "Complete your payment using Nagad and follow the provided instructions.", null, { text: "Nagad", bg: "#F6921E" }],
  ["bank", "Bank Transfer", "Use the bank account details provided during checkout.", Building2, null]
];

export default function Payment() {
  const { cart, total, clearCart, saveOrderLocally, hydrated } = useStore();
  const { settings } = useSiteSettings();
  const [method, setMethod] = useState("cod");
  const [state, setState] = useState("");
  const [error, setError] = useState("");
  const [customer, setCustomer] = useState(null);

  const feeDefault = Number(settings.delivery_fee_default || 80);
  const threshold = Number(settings.free_delivery_threshold || 2000);
  const delivery = total >= threshold || total === 0 ? 0 : feeDefault;
  const taxRate = settings.tax_enabled === "true" ? Number(settings.tax_rate || 0) : 0;
  const tax = taxRate > 0 ? Math.round(total * taxRate) / 100 : 0;
  const grand = total + delivery + tax;

  const methods = PAYMENT_METHODS.filter(([id]) => settings[`payment_${id}_enabled`] !== "false");
  const activeMethod = methods.some(([id]) => id === method) ? method : (methods[0]?.[0] || "cod");

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
        total: grand,
        payment_method: activeMethod
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
        method: activeMethod,
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
      <div className="co-intro">
        <div className="container">
          <div className="co-eyebrow"><Lock size={12} aria-hidden="true" /> Secure Checkout</div>
          <h1>Payment</h1>
          <p>Choose how you&apos;d like to pay for your order.</p>
          <CheckoutSteps step={2} />
        </div>
      </div>
      <section className="section co-section">
        <div className="container co-layout">
          <div className="co-main">
            {error && (
              <div className="co-error" role="alert">
                {error}
              </div>
            )}

            <div className="co-methods" role="radiogroup" aria-label="Payment method">
              {(methods.length ? methods : PAYMENT_METHODS.slice(0, 1)).map(([id, title, desc, Icon, badge]) => {
                const selected = activeMethod === id;
                return (
                  <label key={id} className={`co-method${selected ? " selected" : ""}`}>
                    <input
                      type="radio"
                      name="payment-method"
                      checked={selected}
                      onChange={() => setMethod(id)}
                    />
                    <span className="co-radio" aria-hidden="true" />
                    <span className="co-method-text">
                      <strong>{title}</strong>
                      <small>{desc}</small>
                    </span>
                    {badge ? (
                      <span className="co-pay-logo" style={{ background: badge.bg }} aria-hidden="true">
                        {badge.text}
                      </span>
                    ) : Icon ? (
                      <span className="co-method-icon" aria-hidden="true">
                        <Icon size={20} />
                      </span>
                    ) : null}
                  </label>
                );
              })}
            </div>

            {settings.payment_instructions && (
              <div className="co-note">
                <strong>Payment Note</strong>
                <p>{settings.payment_instructions}</p>
              </div>
            )}

            {activeMethod === "cod" && (
              <div className="co-note">
                <strong>No advance needed</strong>
                <p>Please keep the exact order total ready — our courier collects payment upon delivery.</p>
              </div>
            )}
            {activeMethod === "bkash" && (
              <div className="co-note">
                <strong>bKash merchant instruction</strong>
                <p>Your order is stored first. Once placed, send the order total to our official bKash merchant number with your order number as the reference. The order stays pending until payment is verified.</p>
              </div>
            )}
            {activeMethod === "nagad" && (
              <div className="co-note">
                <strong>Nagad instruction</strong>
                <p>Your order is stored first. Send payment to our official Nagad number using your order number as reference. The order stays pending until payment is verified.</p>
              </div>
            )}
            {activeMethod === "bank" && (
              <div className="co-note">
                <strong>Bank transfer instruction</strong>
                <p>Your order is saved as awaiting bank payment. Our team verifies the transfer and confirms your order once it clears.</p>
              </div>
            )}

            <button
              className="btn btn-primary co-pay-btn"
              onClick={pay}
              disabled={state === "processing"}
            >
              {state === "processing" ? "Placing Your Order…" : activeMethod === "cod" ? "Place COD Order" : `Place ${activeMethod.toUpperCase()} Order`}
            </button>
            <p className="co-secure">
              <Lock size={13} aria-hidden="true" /> Your order details are sent securely to our order system.
            </p>
          </div>

          <aside className="co-summary" aria-label="Payment summary">
            <h3>Summary</h3>
            {cart.map((x) => (
              <div className="co-sumline co-sumitem" key={x.key}>
                <span className="co-sumthumb" aria-hidden="true">
                  {x.image ? <img src={x.image} alt="" /> : <span className="orb nut" />}
                </span>
                <span className="co-sumname">
                  {x.name} ({x.size}) × {x.qty}
                </span>
                <span>৳{(Number(x.price || 0) * Number(x.qty || 1)).toLocaleString()}</span>
              </div>
            ))}
            <div className="co-sumline">
              <span>Subtotal</span>
              <span>৳{total.toLocaleString()}</span>
            </div>
            <div className="co-sumline">
              <span>Delivery</span>
              <span>{delivery ? "৳" + delivery : "Free"}</span>
            </div>
            {taxRate > 0 && (
              <div className="co-sumline">
                <span>Tax ({taxRate}%)</span>
                <span>৳{tax.toLocaleString()}</span>
              </div>
            )}
            <div className="co-sumline co-sumtotal">
              <span>Total</span>
              <span>৳{grand.toLocaleString()}</span>
            </div>
            {customer && (
              <div className="co-deliver-to">
                <div className="muted">Delivering to</div>
                <strong>{customer.name}</strong> ({customer.phone})
                <div className="muted">
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
