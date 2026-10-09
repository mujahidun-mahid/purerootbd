import Link from "next/link";

const COMBOS = [
  { id: "fruit-pack", name: "Fruit Pack", desc: "Seasonal bestsellers", price: "৳499", tag: "-20%", icon: "\u{1F34F}" },
  { id: "top-combo", name: "Top Combo", desc: "Veg + essentials", price: "৳799", tag: "Bestseller", icon: "\u{1F957}" },
  { id: "seafood", name: "Seafood", desc: "Fresh catch daily", price: "৳999", tag: "-15%", icon: "\u{1F990}" },
  { id: "bakery", name: "Bakery Box", desc: "Freshly baked", price: "৳349", tag: "New", icon: "\u{1F968}" },
];

export default function ComboCarousel() {
  return (
    <section className="mobile-only combo-section" aria-labelledby="combo-heading">
      <div className="container combo-head">
        <h2 id="combo-heading">Smart Combo Picks</h2>
        <Link href="/shop" className="combo-link">View all</Link>
      </div>
      <div className="container combo-track">
        {COMBOS.map((c) => (
          <Link key={c.id} href="/shop" className="combo-card">
            <span className="combo-tag">{c.tag}</span>
            <span className="combo-icon" aria-hidden="true">{c.icon}</span>
            <strong>{c.name}</strong>
            <small>{c.desc}</small>
            <span className="combo-price">{c.price}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
