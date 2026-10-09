"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import ProductGrid from "@/components/ProductGrid";
import { categories } from "@/lib/products";
import { useProducts } from "@/components/useProducts";
import { sectionRenderers } from "@/components/PageSections";

export default function Shop() {
  const [cat, setCat] = useState("all");
  const [sort, setSort] = useState("featured");
  const [showFilters, setShowFilters] = useState(false);
  const { products } = useProducts();

  const shown = useMemo(() => {
    let a = cat === "all" ? [...products] : products.filter((p) => p.category === cat);
    if (sort === "low") a.sort((x, y) => x.price - y.price);
    if (sort === "high") a.sort((x, y) => y.price - x.price);
    if (sort === "rating") a.sort((x, y) => y.rating - x.rating);
    return a;
  }, [cat, sort, products]);

  return (
    <>
      <div className="page-head">
        <div className="container">
          <div className="crumb">Home / Shop</div>
          <h1>Shop Pure Nutrition</h1>
          <p className="muted">Browse premium pantry staples for everyday wellness.</p>
        </div>
      </div>
      <section className="section">
        <div className="container shop-layout">
          <aside className={"filters" + (showFilters ? " open" : "")}>
            <h3>Filters</h3>
            <label>Category</label>
            {[{ slug: "all", name: "All Products" }, ...categories].map((c) => (
              <label className="check" key={c.slug}>
                <input type="radio" checked={cat === c.slug} onChange={() => setCat(c.slug)} />
                {c.name}
              </label>
            ))}
            <hr style={{ border: 0, borderTop: "1px solid var(--border)", margin: "20px 0" }} />
            <span className="muted">Price, rating and dietary preference filters can be connected to CMS data.</span>
          </aside>
          <div>
            <div className="toolbar">
              <div className="filterrow">
                <span className="filter">{shown.length} products</span>
                <button
                  type="button"
                  className="btn btn-outline filters-toggle"
                  aria-expanded={showFilters}
                  onClick={() => setShowFilters((v) => !v)}
                >
                  {showFilters ? "Hide Filters" : "Filters"}
                </button>
              </div>
              <select className="filter" value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="featured">Featured</option>
                <option value="newest">Newest</option>
                <option value="low">Price Low to High</option>
                <option value="high">Price High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>
            <ProductGrid products={shown} />
          </div>
        </div>
      </section>
    </>
  );
}