"use client";
import { useEffect, useState } from "react";
import { useStore } from "@/components/StoreProvider";
import { useSiteSettings } from "@/components/SiteSettingsProvider";
import Link from "next/link";
import { Banknote, Building2, Lock, ArrowLeft, ShieldCheck } from "lucide-react";
import PayLogo from "@/components/PayLogo";

const PAYMENT_METHODS = [
  ["cod", "Cash on Delivery", "Cash", "Pay when your order arrives at your doorstep.", Banknote, null, null],
  ["bkash", "bKash Payment", "bKash", "Pay using your bKash account and follow the payment instructions.", null, { text: "bKash", bg: "#E2136E" }, "https://logos-world.net/wp-content/uploads/2024/10/Bkash-Logo.jpg"],
  ["nagad", "Nagad Payment", "Nagad", "Complete your payment using Nagad and follow the provided instructions.", null, { text: "Nagad", bg: "#F6921E" }, "https://www.logo.wine/a/logo/Nagad/Nagad-Logo.wine.svg"],
  ["bank", "Bank Transfer", "Bank", "Use the bank account details provided during checkout.", Building2, null, "https://static.vecteezy.com/system/resources/thumbnails/013/948/616/small/bank-icon-logo-design-vector.jpg"]
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
  const active = methods.find(([id]) => id === activeMethod);
  const ActiveIcon = active && active[4] ? active[4] : null;
  const panelFallback = active && active[5] ? (
    <span className="pm-logo pm-logo-lg" style={{ background: active[5].bg }} aria-hidden="true">
      {active[5].text}
    </span>
  ) : (
    ActiveIcon && (
      <span className="pm-panel-icon" aria-hidden="true">
        <ActiveIcon size={22} />
      </span>
    )
  );

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
    if (!customer?.name?.trim() || !customer?.phone?.trim() || !customer?.address?.trim()) {
      setError("Your delivery information is incomplete. Please return to checkout and fill in your name, phone number, and full address.");
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
      <div className="pm-head">
        <div className="container pm-head-inner">
          <Link className="iconbtn pm-back" href="/checkout" aria-label="Back to checkout">
            <ArrowLeft size={20} />
          </Link>
          <h1>Payment Method</h1>
          <span className="pm-head-lock" aria-hidden="true">
            <Lock size={18} />
          </span>
        </div>
      </div>

      <section className="section pm-section">
        <div className="container pm-wrap">
          {error && (
            <div className="pm-error" role="alert">
              {error}
            </div>
          )}

          <div className="pm-methods" role="radiogroup" aria-label="Choose a payment method">
            {(methods.length ? methods : PAYMENT_METHODS.slice(0, 1)).map(([id, title, short, , Icon, badge, logo]) => {
              const selected = activeMethod === id;
              const fallback = badge ? (
                <span className="pm-logo" style={{ background: badge.bg }}>{badge.text}</span>
              ) : (
                Icon && <Icon size={22} />
              );
              return (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-label={title}
                  title={title}
                  className={`pm-method${selected ? " selected" : ""}`}
                  onClick={() => setMethod(id)}
                >
                  <span className="pm-micon" aria-hidden="true">
                    {logo ? (
                      <PayLogo src={logo} alt={`${title} logo`} whiteBg={id === "nagad"} fallback={fallback} />
                    ) : (
                      fallback
                    )}
                  </span>
                  <span className="pm-mname">{short}</span>
                </button>
              );
            })}
          </div>

          {active && (
            <div className="pm-panel">
              <div className="pm-panel-head">
                {active[6] ? (
                  <PayLogo
                    src={active[6]}
                    alt={`${active[1]} logo`}
                    whiteBg={active[0] === "nagad"}
                    large
                    fallback={panelFallback}
                  />
                ) : (
                  panelFallback
                )}
                <div>
                  <strong>{active[1]}</strong>
                  <p>{active[3]}</p>
                </div>
              </div>
              {activeMethod === "cod" && (
                <p className="pm-hint">No advance needed — please keep the exact order total ready for our courier.</p>
              )}
              {activeMethod === "bkash" && (
                <p className="pm-hint">Your order is stored first. Once placed, send the total to our official bKash merchant number with your order number as reference. The order stays pending until payment is verified.</p>
              )}
              {activeMethod === "nagad" && (
                <p className="pm-hint">Your order is stored first. Send payment to our official Nagad number using your order number as reference. The order stays pending until payment is verified.</p>
              )}
              {activeMethod === "bank" && (
                <p className="pm-hint">Your order is saved as awaiting bank payment. Our team verifies the transfer and confirms your order once it clears.</p>
              )}
              {settings.payment_instructions && (
                <p className="pm-hint"><strong>Note: </strong>{settings.payment_instructions}</p>
              )}
            </div>
          )}

          <div className="pm-summary" aria-label="Order summary">
            <div className="pm-sumline">
              <span>Subtotal</span>
              <span>৳{total.toLocaleString()}</span>
            </div>
            <div className="pm-sumline">
              <span>Delivery</span>
              <span>{delivery ? "৳" + delivery : "Free"}</span>
            </div>
            {taxRate > 0 && (
              <div className="pm-sumline">
                <span>Tax ({taxRate}%)</span>
                <span>৳{tax.toLocaleString()}</span>
              </div>
            )}
            <div className="pm-sumline pm-sumtotal">
              <span>Total</span>
              <span>৳{grand.toLocaleString()}</span>
            </div>
            {customer && (
              <div className="pm-deliver-to">
                <span className="muted">Delivering to </span>
                <strong>{customer.name}</strong>
                <span className="muted"> · {customer.address}, {customer.area || customer.district}</span>
              </div>
            )}
          </div>

          <button
            className="pm-pay"
            onClick={pay}
            disabled={state === "processing"}
          >
            {state === "processing" ? "Placing Your Order…" : activeMethod === "cod" ? "Place COD Order" : `Place ${activeMethod.toUpperCase()} Order`}
          </button>
          <p className="pm-secure">
            <ShieldCheck size={14} aria-hidden="true" /> Orders are confirmed by our backend before anything is finalized.
          </p>
        </div>
      </section>
    </>
  );
}
