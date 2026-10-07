"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useStore } from "@/components/StoreProvider";

export default function Checkout() {
  const { cart, total } = useStore();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    division: "",
    district: "",
    upazila: "",
    area: "",
    postal: "",
    address: "",
    notes: ""
  });
  const [error, setError] = useState("");
  const delivery = total >= 2000 || total === 0 ? 0 : 80;

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("pr-checkout");
      if (saved) {
        setForm((prev) => ({ ...prev, ...JSON.parse(saved) }));
      }
    } catch {}
  }, []);

  function submit(e) {
    e.preventDefault();
    if (!form.name?.trim()) {
      setError("Please provide your full name.");
      return;
    }
    if (!form.phone?.trim()) {
      setError("Please provide your mobile number.");
      return;
    }
    if (!form.address?.trim()) {
      setError("Please provide your full delivery address.");
      return;
    }

    setError("");
    sessionStorage.setItem("pr-checkout", JSON.stringify(form));
    location.href = "/payment";
  }

  if (!cart.length) {
    return (
      <section className="section">
        <div className="container" style={{ textAlign: "center", padding: "60px 20px" }}>
          <h2>Your Cart is Empty</h2>
          <p className="muted">Add some products before checking out.</p>
          <Link className="btn btn-primary" href="/shop" style={{ marginTop: 14 }}>
            Explore Shop
          </Link>
        </div>
      </section>
    );
  }

  return (
    <>
      <div className="page-head">
        <div className="container">
          <div className="crumb">Cart / Checkout</div>
          <h1>Delivery Details</h1>
          <p className="muted">Provide your shipping address for fast doorstep delivery across Bangladesh.</p>
        </div>
      </div>
      <section className="section">
        <div className="container cart-layout">
          <form onSubmit={submit}>
            <h2>Delivery Information</h2>
            {error && (
              <div className="notice" style={{ color: "var(--danger)", margin: "14px 0", background: "#fff4f2", borderColor: "#f0c9c4" }}>
                {error}
              </div>
            )}
            <div className="form-grid">
              <div>
                <label>Full Name *</label>
                <input
                  className="input"
                  required
                  value={form.name}
                  placeholder="e.g. Tanvir Ahmed"
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label>Mobile Number *</label>
                <input
                  className="input"
                  required
                  placeholder="01XXXXXXXXX"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div>
                <label>Email Address</label>
                <input
                  className="input"
                  type="email"
                  placeholder="name@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div>
                <label>Division</label>
                <select
                  className="input"
                  value={form.division}
                  onChange={(e) => setForm({ ...form, division: e.target.value })}
                >
                  <option value="">Select Division</option>
                  <option>Dhaka</option>
                  <option>Chattogram</option>
                  <option>Sylhet</option>
                  <option>Rajshahi</option>
                  <option>Khulna</option>
                  <option>Barishal</option>
                  <option>Rangpur</option>
                  <option>Mymensingh</option>
                </select>
              </div>
              <div>
                <label>District / City</label>
                <input
                  className="input"
                  placeholder="e.g. Dhaka, Chittagong"
                  value={form.district}
                  onChange={(e) => setForm({ ...form, district: e.target.value })}
                />
              </div>
              <div>
                <label>Upazila / Thana</label>
                <input
                  className="input"
                  placeholder="e.g. Dhanmondi, Gulshan"
                  value={form.upazila}
                  onChange={(e) => setForm({ ...form, upazila: e.target.value })}
                />
              </div>
              <div>
                <label>Area / Locality</label>
                <input
                  className="input"
                  placeholder="e.g. Road 27, Sector 3"
                  value={form.area}
                  onChange={(e) => setForm({ ...form, area: e.target.value })}
                />
              </div>
              <div>
                <label>Postal Code</label>
                <input
                  className="input"
                  placeholder="e.g. 1209"
                  value={form.postal}
                  onChange={(e) => setForm({ ...form, postal: e.target.value })}
                />
              </div>
              <div className="full">
                <label>Full Delivery Address *</label>
                <textarea
                  className="input"
                  required
                  rows="3"
                  placeholder="House/Apartment number, street name, landmarks..."
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </div>
              <div className="full">
                <label>Delivery Instructions / Notes</label>
                <textarea
                  className="input"
                  rows="2"
                  placeholder="Optional notes for courier..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
            </div>
            <button className="btn btn-primary" style={{ marginTop: 22 }}>
              Continue to Payment →
            </button>
          </form>

          <aside className="summary">
            <h3>Order Summary</h3>
            {cart.map((x) => (
              <div className="sumline" key={x.key}>
                <span>
                  {x.name} ({x.size}) × {x.qty}
                </span>
                <span>৳{(Number(x.price || 0) * Number(x.qty || 1)).toLocaleString()}</span>
              </div>
            ))}
            <div className="sumline">
              <span>Delivery Fee</span>
              <span>{delivery ? "৳" + delivery : "Free (Orders ৳2000+)"}</span>
            </div>
            <div className="sumline sumtotal">
              <span>Total Payable</span>
              <span>৳{(total + delivery).toLocaleString()}</span>
            </div>
            <Link href="/cart" className="muted" style={{ display: "block", marginTop: 12, fontSize: 13 }}>
              ← Edit Cart
            </Link>
          </aside>
        </div>
      </section>
    </>
  );
}
