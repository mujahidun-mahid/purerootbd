"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function CategoryStrip({ categories = [], counts = {}, title = "Shop by Category" }) {
  const pathname = usePathname();
  if (!categories.length) return null;
  return (
    <section className="cat-strip" aria-label={title}>
      <div className="container cat-strip-track">
        {categories.map((c) => {
          const href = `/category/${c.slug}`;
          const active = pathname === href;
          return (
            <Link key={c.slug} href={href} className={`cat-strip-item${active ? " active" : ""}`} aria-current={active ? "true" : undefined}>
              <span className="cat-strip-icon" aria-hidden="true">
                {c.image ? <img src={c.image} alt="" loading="lazy" /> : (c.icon || "📦")}
              </span>
              <span className="cat-strip-name">{c.name}</span>
              {counts[c.slug] != null && (
                <span className="cat-strip-count">{counts[c.slug]} items</span>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
