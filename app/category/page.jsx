import Link from "next/link";
import { loadCategories, loadProducts, LIST_COLUMNS } from "@/lib/products-server";

// ISR: categories and product counts refresh every 60 seconds.
export const revalidate = 60;

export const metadata = {
  title: "Shop by Category",
  description: "Browse every Pure Roots category — nuts, spices, seeds, dried food and more.",
  alternates: { canonical: "/category" }
};

export default async function CategoryIndex() {
  const [categories, products] = await Promise.all([
    loadCategories(),
    loadProducts({ columns: LIST_COLUMNS })
  ]);

  const counts = {};
  for (const p of products) {
    if (!p.category) continue;
    counts[p.category] = (counts[p.category] || 0) + 1;
  }

  return (
    <>
      <div className="page-head">
        <div className="container">
          <div className="crumb">
            <Link href="/">Home</Link> / Categories
          </div>
          <h1>Shop by Category</h1>
          <p className="muted">Explore our range of natural foods, one category at a time.</p>
        </div>
      </div>

      <section className="section">
        <div className="container">
          {categories.length ? (
            <div className="cat-grid">
              {categories.map((c) => {
                const count = counts[c.slug] || 0;
                return (
                  <Link key={c.slug} href={`/category/${c.slug}`} className="cat">
                    <div className="cat-art">
                      {c.image ? (
                        <img src={c.image} alt={c.name} loading="lazy" />
                      ) : (
                        <span className="cat-icon" aria-hidden="true">{c.icon || "📦"}</span>
                      )}
                    </div>
                    <div>
                      <strong>{c.name}</strong>
                      {c.description ? (
                        <small className="muted cat-desc">{c.description}</small>
                      ) : null}
                      <small className="cat-count">
                        {count ? `${count} product${count === 1 ? "" : "s"}` : "Coming soon"}
                      </small>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="empty">
              <p className="muted">No categories to display yet.</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
