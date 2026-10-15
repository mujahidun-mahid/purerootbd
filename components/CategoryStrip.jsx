import Link from "next/link";

export default function CategoryStrip({ categories = [], counts = {}, title = "Shop by Category" }) {
  if (!categories.length) return null;
  return (
    <section className="cat-strip" aria-label={title}>
      <div className="container cat-strip-track">
        {categories.map((c) => (
          <Link key={c.slug} href={`/category/${c.slug}`} className="cat-strip-item">
            <span className="cat-strip-icon" aria-hidden="true">
              {c.image ? <img src={c.image} alt="" loading="lazy" /> : (c.icon || "📦")}
            </span>
            <span className="cat-strip-name">{c.name}</span>
            {counts[c.slug] != null && (
              <span className="cat-strip-count">{counts[c.slug]} items</span>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
