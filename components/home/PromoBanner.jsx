import Link from "next/link";

export const PROMO_BANNERS = [
  {
    id: 1,
    badge: "Flat 20% Discount",
    headline: "Purely Fresh Vegetables",
    description: "Crisp, organic, and hand-picked daily from local farms.",
    cta: "Shop Vegetables",
    link: "/category/vegetables",
    image: "/images/promos/vegetables-basket.jpg",
    bg: "linear-gradient(135deg, #FFFDF9 0%, #F7F9F6 100%)",
  },
  {
    id: 2,
    badge: "Flat 25% Discount",
    headline: "Fresh Fruits, Pure Quality",
    description: "Sun-ripened sweetness delivered straight to your door.",
    cta: "Shop Fruits",
    link: "/category/fruits",
    image: "/images/promos/fruits-cluster.jpg",
    bg: "linear-gradient(135deg, #F0FDF4 0%, #ECFDF5 100%)",
  },
];

export default function PromoBanner() {
  return (
    <section className="section promo-banners" aria-labelledby="promo-heading">
      <div className="container">
        <h2 id="promo-heading" className="visually-hidden">Promotional Offers</h2>
        <div className="grid promo-grid">
          {PROMO_BANNERS.map((banner) => (
            <article key={banner.id} className="promo-card" style={{ background: banner.bg }}>
              <div className="promo-content">
                <span className="promo-badge">{banner.badge}</span>
                <h3>{banner.headline}</h3>
                <p>{banner.description}</p>
                <Link href={banner.link} className="btn btn-primary">{banner.cta}</Link>
              </div>
              <div className="promo-visual" aria-hidden="true">
                <img src={banner.image} alt="" className="promo-image" loading="lazy" onError={(e) => { e.currentTarget.style.display = "none"; }} />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
