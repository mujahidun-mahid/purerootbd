"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import ProductCard from "./ProductCard";

function prettyCategory(slug) {
  return String(slug || "")
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function FeaturedProducts({
  products = [],
  limit = 10,
  title = "Featured Products",
  subtitle = "",
  enabled = true,
  productIds = [],
}) {
  const [active, setActive] = useState("All");

  const pool = useMemo(() => {
    if (Array.isArray(productIds) && productIds.length) {
      const ids = productIds.map((s) => String(s).trim().toLowerCase()).filter(Boolean);
      const picked = ids
        .map((id) => products.find((p) => p.slug === id || p.id === id))
        .filter(Boolean);
      return picked.length ? picked : products;
    }
    return products;
  }, [products, productIds]);

  const filters = useMemo(() => {
    const seen = [];
    pool.forEach((p) => {
      if (p.category && !seen.includes(p.category)) seen.push(p.category);
    });
    return ["All", ...seen];
  }, [pool]);

  const shown = useMemo(() => {
    const list = active === "All" ? pool : pool.filter((p) => p.category === active);
    return list.slice(0, limit);
  }, [pool, active, limit]);

  if (!enabled) return null;

  return (
    <section className="section" aria-labelledby="featured-products-h">
      <div className="container">
        <div className="fp-head">
          <div>
            <div className="kicker">Handpicked</div>
            <h2 id="featured-products-h">{title}</h2>
            {subtitle && <p className="muted" style={{ margin: "8px 0 0" }}>{subtitle}</p>}
          </div>
          <nav className="fp-filters" aria-label="Filter products by category">
            {filters.map((f) => (
              <button
                key={f}
                type="button"
                className={`fp-filter${active === f ? " active" : ""}`}
                onClick={() => setActive(f)}
                aria-pressed={active === f}
              >
                {f === "All" ? "All" : prettyCategory(f)}
              </button>
            ))}
          </nav>
        </div>

        {shown.length ? (
          <div className="grid fp-grid">
            {shown.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="empty">
            <p className="muted">No products in this category yet.</p>
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: 26 }}>
          <Link className="btn btn-outline" href="/shop">View All Products</Link>
        </div>
      </div>
    </section>
  );
}
