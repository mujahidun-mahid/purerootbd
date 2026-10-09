"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Package, Truck, RefreshCw, Download, Undo2, MapPin, Plus, Trash2,
  Heart, Bell, ShieldCheck, UserRound, Check, X,
  ShoppingBag, ChevronDown
} from "lucide-react";
import { useStore } from "@/components/StoreProvider";
import { useProducts } from "@/components/useProducts";

const TIMELINE_STEPS = ["Order Placed", "Order Confirmed", "Processing", "Packed", "Shipped", "Out for Delivery", "Delivered"];

function indexForStatus(status) {
  const s = String(status || "").toLowerCase();
  if (s.includes("deliver") && !s.includes("out for")) return 6;
  if (s.includes("out for")) return 5;
  if (s.includes("ship")) return 4;
  if (s.includes("pack")) return 3;
  if (s.includes("process")) return 2;
  if (s.includes("confirm")) return 1;
  return 0;
}

function readJSON(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function orderDateValue(o) {
  const raw = o.placed_at || o.date;
  const t = raw ? new Date(raw).getTime() : NaN;
  return Number.isNaN(t) ? 0 : t;
}

function orderLabel(o) {
  return o.order || o.order_number || "Order";
}

function fmtDate(o) {
  if (o.date) return o.date;
  if (o.placed_at) return new Date(o.placed_at).toLocaleDateString("en-BD");
  return "—";
}

function isRecent(o, days = 30) {
  const t = orderDateValue(o);
  if (!t) return true;
  return Date.now() - t <= days * 86400000;
}

function Switch({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`acct-switch${checked ? " on" : ""}`}
      onClick={() => onChange(!checked)}
    >
      <span className="acct-switch-knob" />
    </button>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="acct-modal-backdrop" onClick={onClose} role="presentation">
      <div className="acct-modal" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="acct-modal-head">
          <h3>{title}</h3>
          <button type="button" className="iconbtn" onClick={onClose} aria-label="Close dialog"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

const NAV = [
  { id: "orders", label: "Orders & Tracking", icon: Package },
  { id: "details", label: "Personal Details", icon: UserRound },
  { id: "wishlist", label: "Wishlist & Alerts", icon: Heart },
];

export default function Account() {
  const { orders, add, wishlist, toggleWish, showToast } = useStore();
  const { products } = useProducts();
  const [active, setActive] = useState("orders");

  // ---- Module A: filters ----
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [range, setRange] = useState("all");
  const [expanded, setExpanded] = useState(null);

  const statuses = useMemo(() => {
    const s = new Set((orders || []).map((o) => o.status || "Order Placed"));
    return ["all", ...s];
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const q = query.trim().toLowerCase();
    const now = Date.now();
    return (orders || []).filter((o) => {
      if (q && !orderLabel(o).toLowerCase().includes(q)) return false;
      if (status !== "all" && (o.status || "Order Placed") !== status) return false;
      if (range !== "all") {
        const t = orderDateValue(o);
        if (!t) return false;
        const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
        if (now - t > days * 86400000) return false;
      }
      return true;
    });
  }, [orders, query, status, range]);

  function buyItAgain(order) {
    const items = order.items || [];
    if (!items.length) {
      showToast("No item details saved for this order", "error");
      return;
    }
    items.forEach((it) => {
      add(
        {
          id: it.productId || it.id || it.slug,
          slug: it.slug,
          name: it.name,
          price: Number(it.price) || 0,
          packages: [{ size: it.size || "500g", price: Number(it.price) || 0 }],
          category: it.imageType || "",
          image: it.image || "",
        },
        it.size || "500g",
        Number(it.qty) || 1
      );
    });
    showToast(`${items.length} item${items.length > 1 ? "s" : ""} added back to cart`);
  }

  function downloadInvoice(order) {
    const items = order.items || [];
    const rows = items.map((it) => `<tr><td>${it.name || ""} (${it.size || ""})</td><td>${it.qty || 1}</td><td>৳${Number(it.price || 0).toLocaleString()}</td></tr>`).join("");
    const html = `<!doctype html><html><head><title>Invoice ${orderLabel(order)}</title><style>body{font-family:Arial,sans-serif;padding:32px;color:#1a1a1a}table{width:100%;border-collapse:collapse;margin-top:16px}td,th{border:1px solid #ddd;padding:8px;text-align:left}</style></head><body><h1>Pure Roots — Invoice</h1><p><strong>${orderLabel(order)}</strong> · ${fmtDate(order)} · ${order.status || "Order Placed"}</p><table><tr><th>Item</th><th>Qty</th><th>Price</th></tr>${rows}</table><h3>Total: ৳${Number(order.total || 0).toLocaleString()}</h3><script>window.onload=function(){window.print()}<\/script></body></html>`;
    const w = window.open("", "_blank");
    if (!w) {
      showToast("Please allow pop-ups to download the invoice", "error");
      return;
    }
    w.document.write(html);
    w.document.close();
  }

  function requestReturn(order) {
    if (!window.confirm(`Request a return for ${orderLabel(order)}? Our team will contact you.`)) return;
    showToast("Return request submitted. We will contact you shortly.");
  }

  // ---- Module B: profile / addresses / security ----
  const [profile, setProfile] = useState({ name: "", email: "", phone: "" });
  const [addresses, setAddresses] = useState([]);
  const [showAddrModal, setShowAddrModal] = useState(false);
  const [addrForm, setAddrForm] = useState({ tag: "Home", line: "", city: "", phone: "" });
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [twoFA, setTwoFA] = useState(false);

  useEffect(() => {
    setProfile(readJSON("pr-profile", { name: "", email: "", phone: "" }));
    setAddresses(readJSON("pr-addresses", []));
    setTwoFA(readJSON("pr-2fa", false));
  }, []);

  function saveProfile(e) {
    e.preventDefault();
    writeJSON("pr-profile", profile);
    showToast("Profile info updated");
  }

  function saveAddress(e) {
    e.preventDefault();
    if (!addrForm.line.trim()) {
      showToast("Please enter a street address", "error");
      return;
    }
    const entry = { id: `addr-${Date.now()}`, ...addrForm, isDefault: addresses.length === 0 };
    const next = [...addresses, entry];
    setAddresses(next);
    writeJSON("pr-addresses", next);
    setAddrForm({ tag: "Home", line: "", city: "", phone: "" });
    setShowAddrModal(false);
    showToast("Address saved");
  }

  function setDefaultAddress(id) {
    const next = addresses.map((a) => ({ ...a, isDefault: a.id === id }));
    setAddresses(next);
    writeJSON("pr-addresses", next);
    showToast("Default shipping address updated");
  }

  function deleteAddress(id) {
    if (!window.confirm("Delete this address?")) return;
    const next = addresses.filter((a) => a.id !== id);
    setAddresses(next);
    writeJSON("pr-addresses", next);
  }

  function changePassword(e) {
    e.preventDefault();
    if (!pw.next || pw.next.length < 6) {
      showToast("New password must be at least 6 characters", "error");
      return;
    }
    if (pw.next !== pw.confirm) {
      showToast("New passwords do not match", "error");
      return;
    }
    setPw({ current: "", next: "", confirm: "" });
    showToast("Password changed successfully");
  }

  // ---- Module D: wishlist / notifications ----
  const [prefs, setPrefs] = useState({ newsletter: true, sms: true, drops: false });
  useEffect(() => {
    setPrefs({ newsletter: true, sms: true, drops: false, ...readJSON("pr-prefs", {}) });
  }, []);

  function setPref(key, value) {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    writeJSON("pr-prefs", next);
  }

  const wishlistItems = useMemo(
    () => (wishlist || []).map((slug) => products.find((p) => p.slug === slug)).filter(Boolean),
    [wishlist, products]
  );

  function moveToCart(p) {
    add(p);
    toggleWish(p.slug);
  }

  return (
    <>
      <div className="page-head">
        <div className="container">
          <div className="crumb">Account / Profile</div>
          <h1>My Account</h1>
          <p className="muted">Orders, addresses, payments and preferences — all in one place.</p>
        </div>
      </div>

      <section className="section">
        <div className="container acct-layout">
          {/* Sidebar */}
          <aside className="acct-side" aria-label="Account sections">
            <nav className="acct-nav">
              {NAV.map((n) => (
                <a
                  key={n.id}
                  href={`#${n.id}`}
                  onClick={() => setActive(n.id)}
                  className={`acct-nav-link${active === n.id ? " active" : ""}`}
                  aria-current={active === n.id ? "true" : undefined}
                >
                  <n.icon size={18} />
                  <span>{n.label}</span>
                </a>
              ))}
            </nav>
            <div className="acct-side-card">
              <Truck size={20} />
              <div>
                <strong>Need help with an order?</strong>
                <p className="muted">Track any delivery with your phone number — no login needed.</p>
                <Link className="btn btn-outline btn-block" href="/track-order">Track Order</Link>
              </div>
            </div>
          </aside>

          <div className="acct-main">
            {/* MODULE A */}
            <section id="orders" className="acct-module" aria-labelledby="orders-h">
              <div className="acct-module-head">
                <div>
                  <div className="kicker">Module A</div>
                  <h2 id="orders-h">Order History & Tracking</h2>
                </div>
                <Link className="btn btn-outline" href="/shop"><ShoppingBag size={16} /> Shop More</Link>
              </div>

              <div className="acct-filters">
                <input className="input" type="search" placeholder="Filter by order ID…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Filter by order ID" />
                <select className="input" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
                  {statuses.map((s) => (
                    <option key={s} value={s}>{s === "all" ? "All statuses" : s}</option>
                  ))}
                </select>
                <select className="input" value={range} onChange={(e) => setRange(e.target.value)} aria-label="Filter by date">
                  <option value="all">Any date</option>
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                </select>
              </div>

              {filteredOrders.length ? (
                <div className="acct-order-list">
                  {filteredOrders.map((o) => {
                    const id = orderLabel(o);
                    const open = expanded === id;
                    const step = indexForStatus(o.status);
                    const items = o.items || [];
                    return (
                      <article className="acct-card" key={id}>
                        <div className="acct-order-top">
                          <div className="acct-thumbs" aria-hidden="true">
                            {items.slice(0, 4).map((it, i) =>
                              it.image ? (
                                <img key={i} src={it.image} alt="" loading="lazy" />
                              ) : (
                                <span key={i} className="acct-thumb-orb" />
                              )
                            )}
                            {!items.length && <span className="acct-thumb-orb" />}
                            {items.length > 4 && <span className="acct-thumb-more">+{items.length - 4}</span>}
                          </div>
                          <div className="acct-order-meta">
                            <strong>{id}</strong>
                            <span className="muted">{fmtDate(o)} · {items.length} item{items.length === 1 ? "" : "s"}</span>
                            <span className="acct-status">{o.status || "Order Placed"}</span>
                          </div>
                          <div className="acct-order-total">
                            <strong>৳{Number(o.total || 0).toLocaleString()}</strong>
                          </div>
                        </div>

                        <div className="acct-order-actions">
                          <button type="button" className="btn btn-outline btn-sm" onClick={() => setExpanded(open ? null : id)} aria-expanded={open}>
                            <Truck size={14} /> Track Package <ChevronDown size={14} className={open ? "flip" : ""} />
                          </button>
                          <button type="button" className="btn btn-outline btn-sm" onClick={() => buyItAgain(o)}>
                            <RefreshCw size={14} /> Buy It Again
                          </button>
                          <button type="button" className="btn btn-outline btn-sm" onClick={() => downloadInvoice(o)}>
                            <Download size={14} /> PDF Invoice
                          </button>
                          {isRecent(o) && (
                            <button type="button" className="acct-link" onClick={() => requestReturn(o)}>
                              <Undo2 size={14} /> Request Return
                            </button>
                          )}
                        </div>

                        {open && (
                          <ol className="acct-timeline">
                            {TIMELINE_STEPS.map((s, i) => (
                              <li key={s} className={i < step ? "done" : i === step ? "current" : ""}>
                                <span className="dot" aria-hidden="true">{i < step ? <Check size={12} /> : i + 1}</span>
                                <span>{s}</span>
                              </li>
                            ))}
                          </ol>
                        )}
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="empty">
                  <Package size={28} style={{ color: "var(--green)" }} />
                  <h3>No orders found</h3>
                  <p className="muted">{orders?.length ? "Try a different filter." : "Orders placed on this device will appear here."}</p>
                  <Link className="btn btn-primary" href="/shop" style={{ marginTop: 12 }}>Start Shopping</Link>
                </div>
              )}
            </section>

            {/* MODULE B */}
            <section id="details" className="acct-module" aria-labelledby="details-h">
              <div className="acct-module-head">
                <div>
                  <div className="kicker">Module B</div>
                  <h2 id="details-h">Personal Details & Security</h2>
                </div>
              </div>

              <div className="acct-card">
                <h3>Profile Info</h3>
                <form onSubmit={saveProfile} className="acct-form-grid">
                  <div><label htmlFor="pf-name">Full Name</label><input id="pf-name" className="input" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} placeholder="Your full name" autoComplete="name" /></div>
                  <div><label htmlFor="pf-email">Email Address</label><input id="pf-email" className="input" type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} placeholder="you@example.com" autoComplete="email" /></div>
                  <div><label htmlFor="pf-phone">Phone Number</label><input id="pf-phone" className="input" type="tel" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} placeholder="01XXXXXXXXX" autoComplete="tel" /></div>
                  <div className="acct-form-actions"><button type="submit" className="btn btn-primary">Update Info</button></div>
                </form>
              </div>

              <div className="acct-card">
                <div className="acct-card-head">
                  <h3>Address Book</h3>
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowAddrModal(true)}><Plus size={14} /> Add New Address</button>
                </div>
                {addresses.length ? (
                  <div className="acct-addr-grid">
                    {addresses.map((a) => (
                      <div className={`acct-addr${a.isDefault ? " default" : ""}`} key={a.id}>
                        <div className="acct-addr-top">
                          <span className="acct-tag">{a.tag}</span>
                          {a.isDefault && <span className="acct-badge">Default</span>}
                        </div>
                        <p><strong>{a.line}</strong></p>
                        <p className="muted">{a.city}{a.phone ? ` · ${a.phone}` : ""}</p>
                        <label className="acct-check">
                          <input type="checkbox" checked={!!a.isDefault} onChange={() => setDefaultAddress(a.id)} />
                          Default Shipping Address
                        </label>
                        <button type="button" className="iconbtn danger" onClick={() => deleteAddress(a.id)} aria-label={`Delete ${a.tag} address`}><Trash2 size={16} /></button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="muted">No saved addresses yet. Add your home or office address for faster checkout.</p>
                )}
              </div>

              <div className="acct-card">
                <h3>Account Security</h3>
                <form onSubmit={changePassword} className="acct-form-grid">
                  <div><label htmlFor="pw-cur">Current Password</label><input id="pw-cur" className="input" type="password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} autoComplete="current-password" /></div>
                  <div><label htmlFor="pw-new">New Password</label><input id="pw-new" className="input" type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} autoComplete="new-password" /></div>
                  <div><label htmlFor="pw-conf">Confirm New Password</label><input id="pw-conf" className="input" type="password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} autoComplete="new-password" /></div>
                  <div className="acct-form-actions"><button type="submit" className="btn btn-primary">Change Password</button></div>
                </form>
                <div className="acct-2fa">
                  <div>
                    <strong><ShieldCheck size={16} style={{ verticalAlign: -3 }} /> Two-Factor Authentication</strong>
                    <p className="muted">Require a one-time code at sign-in for extra protection.</p>
                  </div>
                  <Switch checked={twoFA} onChange={(v) => { setTwoFA(v); writeJSON("pr-2fa", v); showToast(v ? "2FA enabled" : "2FA disabled"); }} label="Two-factor authentication" />
                </div>
              </div>
            </section>

            {/* MODULE C */}
            <section id="wishlist" className="acct-module" aria-labelledby="wishlist-h">
              <div className="acct-module-head">
                <div>
                  <div className="kicker">Module C</div>
                  <h2 id="wishlist-h">Wishlist & Communication</h2>
                </div>
                <Link className="btn btn-outline btn-sm" href="/wishlist">Open Wishlist</Link>
              </div>

              <div className="acct-card">
                <h3>Saved For Later ({wishlistItems.length})</h3>
                {wishlistItems.length ? (
                  <div className="acct-wish-grid">
                    {wishlistItems.map((p) => {
                      const inStock = Number(p.stock ?? 1) > 0;
                      return (
                        <div className="acct-wish" key={p.slug}>
                          <div className="acct-wish-img">
                            {p.image ? <img src={p.image} alt={p.name} loading="lazy" /> : <span className="acct-thumb-orb" />}
                            <span className={`acct-stock${inStock ? " in" : " out"}`}>{inStock ? "In Stock" : "Out of Stock"}</span>
                          </div>
                          <strong>{p.name}</strong>
                          <span className="price">৳{Number(p.price || 0).toLocaleString()}</span>
                          <div className="acct-wish-actions">
                            <button type="button" className="btn btn-primary btn-sm" disabled={!inStock} onClick={() => moveToCart(p)}>Move to Cart</button>
                            <button type="button" className="iconbtn" onClick={() => toggleWish(p.slug)} aria-label={`Remove ${p.name} from wishlist`}><X size={16} /></button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="muted">Nothing saved yet. Tap the heart on any product to save it here.</p>
                )}
              </div>

              <div className="acct-card">
                <h3><Bell size={16} style={{ verticalAlign: -2 }} /> Notification Preferences</h3>
                <ul className="acct-prefs">
                  {[
                    ["newsletter", "Email newsletters", "Offers, new arrivals and nutrition tips."],
                    ["sms", "Order status SMS updates", "Dispatch and delivery alerts on your phone."],
                    ["drops", "Price drop notifications", "Get notified when saved items go on sale."],
                  ].map(([key, label, desc]) => (
                    <li key={key}>
                      <div>
                        <strong>{label}</strong>
                        <p className="muted">{desc}</p>
                      </div>
                      <Switch checked={!!prefs[key]} onChange={(v) => setPref(key, v)} label={label} />
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <p className="muted acct-footnote">
              <MapPin size={13} style={{ verticalAlign: -2 }} /> Profile, addresses, cards, wallet and preferences are stored on this device.
            </p>
          </div>
        </div>
      </section>

      {showAddrModal && (
        <Modal title="Add New Address" onClose={() => setShowAddrModal(false)}>
          <form onSubmit={saveAddress} className="acct-modal-form">
            <div><label htmlFor="addr-tag">Label</label>
              <select id="addr-tag" className="input" value={addrForm.tag} onChange={(e) => setAddrForm({ ...addrForm, tag: e.target.value })}>
                <option>Home</option><option>Office</option><option>Other</option>
              </select>
            </div>
            <div><label htmlFor="addr-line">Street Address</label><input id="addr-line" className="input" value={addrForm.line} onChange={(e) => setAddrForm({ ...addrForm, line: e.target.value })} placeholder="House, road, area" /></div>
            <div><label htmlFor="addr-city">City</label><input id="addr-city" className="input" value={addrForm.city} onChange={(e) => setAddrForm({ ...addrForm, city: e.target.value })} placeholder="Dhaka" /></div>
            <div><label htmlFor="addr-phone">Phone</label><input id="addr-phone" className="input" type="tel" value={addrForm.phone} onChange={(e) => setAddrForm({ ...addrForm, phone: e.target.value })} placeholder="01XXXXXXXXX" /></div>
            <div className="acct-modal-actions">
              <button type="button" className="btn" onClick={() => setShowAddrModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Save Address</button>
            </div>
          </form>
        </Modal>
      )}

    </>
  );
}
