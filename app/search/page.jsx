"use client";
import { useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import ProductGrid from "@/components/ProductGrid";
import { products } from "@/lib/products";

function SearchContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") || "";
  const results = useMemo(
    () => products.filter((p) => (p.name + " " + p.category + " " + (p.short || "")).toLowerCase().includes(q.toLowerCase())),
    [q]
  );

  return (
    <>
      <div className="page-head">
        <div className="container">
          <div className="crumb">
            <Link href="/">Home</Link> / Search
          </div>
          <h1>Search Results</h1>
          <form className="searchbox">
            <input className="input" name="q" defaultValue={q} placeholder="Search almonds, cashew, chia, honey…" />
            <button className="btn btn-primary">Search</button>
          </form>
        </div>
      </div>
      <section className="section">
        <div className="container">
          {q ? (
            <>
              <p className="muted">
                {results.length} result(s) for “{q}”
              </p>
              {results.length ? <ProductGrid products={results} /> : <div className="empty">No matching products found.</div>}
            </>
          ) : (
            <div className="empty">Search our nutrition range above.</div>
          )}
        </div>
      </section>
    </>
  );
}

export default function Search() {
  return (
    <Suspense fallback={<div className="page-head"><div className="container"><h1>Loading search…</h1></div></div>}>
      <SearchContent />
    </Suspense>
  );
}
