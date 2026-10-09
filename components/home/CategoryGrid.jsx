import Link from "next/link";

export const FEATURED_CATEGORIES = [
  { id: 1, name: "Vegetables", slug: "vegetables", image: "/images/categories/vegetables.jpg", icon: "\u{1F96C}" },
  { id: 2, name: "Fresh Meat", slug: "fresh-meat", image: "/images/categories/meat.jpg", icon: "\u{1F969}" },
  { id: 3, name: "Fresh Fish", slug: "fresh-fish", image: "/images/categories/fish.jpg", icon: "\u{1F41F}" },
  { id: 4, name: "Grocery", slug: "grocery", image: "/images/categories/grocery.jpg", icon: "\u{1F6D2}" },
  { id: 5, name: "Bakery", slug: "bakery", image: "/images/categories/bakery.jpg", icon: "\u{1F35E}" },
];

export default function CategoryGrid() {
  return (
    <section className="section featured-categories" aria-labelledby="categories-heading">
      <div className="container">
        <div className="section-head">
          <div>
            <div className="kicker">Explore</div>
            <h2 id="categories-heading">Featured Categories</h2>
          </div>
          <Link href="/shop" className="btn btn-outline">View All Category</Link>
        </div>
        <div className="grid category-grid">
          {FEATURED_CATEGORIES.map((cat) => (
            <Link key={cat.id} href={`/category/${cat.slug}`} className="category-card">
              <div className="category-image">
                <img
                  src={cat.image}
                  alt={cat.name}
                  loading="lazy"
                  onError={(e) => { e.currentTarget.style.display = "none"; e.currentTarget.nextElementSibling.style.display = "flex"; }}
                />
                <span className="category-icon-fallback" style={{ display: "none", fontSize: "48px" }}>{cat.icon}</span>
              </div>
              <strong className="category-name">{cat.name}</strong>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
