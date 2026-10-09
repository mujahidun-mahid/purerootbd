import Link from "next/link";
import ProductGrid from "@/components/ProductGrid";
import { loadProducts, loadCategories } from "@/lib/products-server";
import { getPage } from "@/lib/pages";
import { sectionRenderers } from "@/components/PageSections";
import NewsletterForm from "@/components/NewsletterForm";

export const dynamic = "force-dynamic";

const FEATURED_CATEGORIES = [
  { id: 1, name: "Vegetables", slug: "vegetables", image: "/images/categories/vegetables.jpg", icon: "🥬" },
  { id: 2, name: "Fresh Meat", slug: "fresh-meat", image: "/images/categories/meat.jpg", icon: "🥩" },
  { id: 3, name: "Fresh Fish", slug: "fresh-fish", image: "/images/categories/fish.jpg", icon: "🐟" },
  { id: 4, name: "Grocery", slug: "grocery", image: "/images/categories/grocery.jpg", icon: "🛒" },
  { id: 5, name: "Bakery", slug: "bakery", image: "/images/categories/bakery.jpg", icon: "🍞" },
];

const PROMO_BANNERS = [
  {
    id: 1,
    badge: "Flat 20% Discount",
    headline: "Purely Fresh Vegetables",
    description: "Crisp, organic, and hand-picked daily from local farms.",
    cta: "Shop Vegetables",
    link: "/category/vegetables",
    image: "/images/promos/vegetables-basket.jpg",
    bg: "linear-gradient(135deg, #FFFDF9 0%, #F7F9F6 100%)",
    accent: "#005C33",
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
    accent: "#005C33",
  },
];

export default async function Home() {
  const [page, products, categories] = await Promise.all([
    getPage("home"),
    loadProducts(),
    loadCategories({ featuredOnly: true }),
  ]);

  const settings = {
    site_name: "Pure Roots",
    hero_title: page?.hero_title || "Nature's Nutrition, Delivered Pure",
    hero_subtitle: page?.hero_subtitle || "Premium nuts, seeds, spices, natural honey and nutritious food mixes, carefully selected for your everyday wellness.",
    hero_image_url: page?.hero_image || "",
  };

  return (
    <>
      {page?.sections?.length ? (
        page.sections
          .filter((s) => s.enabled)
          .sort((a, b) => (a.order || 0) - (b.order || 0))
          .map((section, index) => {
            const Renderer = sectionRenderers[section.type];
            return Renderer ? (
              <Renderer key={`${section.id}-${index}`} data={section.data} products={products} categories={categories} />
            ) : (
              <div key={`${section.id}-${index}`} className="muted" style={{ padding: 16, border: "1px dashed var(--border)", borderRadius: 8 }}>
                Unknown section type: {section.type}
              </div>
            );
          })
      ) : (
        <>
          {/* HERO SECTION - Split 2-Column Grid */}
          <section className="hero-section" aria-labelledby="hero-heading">
            <div className="container hero-grid">
              <div className="hero-content">
                <div className="kicker">Fresh Grocery Delivery</div>
                <h1 id="hero-heading" className="serif">
                  Make healthy life with <span className="highlight">fresh</span> grocery
                </h1>
                <p className="hero-desc">Premium quality, farm-to-table freshness delivered to your doorstep. 100% organic, sustainably sourced.</p>
                <Link href="/shop" className="btn btn-primary btn-lg">Shop Now</Link>
              </div>
              <div className="hero-visual">
                <div className="hero-image-wrapper">
                  <img src="/images/hero/grocery-bag.png" alt="Fresh grocery bag with vegetables" className="hero-image" />
                </div>
              </div>
            </div>
          </section>

          {/* FEATURED CATEGORIES - Horizontal Flex Grid */}
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
                      <img src={cat.image} alt={cat.name} onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling.style.display = 'flex'; }} />
                      <span className="category-icon-fallback" style={{ display: 'none', fontSize: '48px' }}>{cat.icon}</span>
                    </div>
                    <strong className="category-name">{cat.name}</strong>
                  </Link>
                ))}
              </div>
            </div>
          </section>

          {/* SPLIT PROMOTIONAL BANNER CARDS */}
          <section className="section promo-banners" aria-labelledby="promo-heading">
            <div className="container">
              <h2 id="promo-heading" className="visually-hidden">Promotional Offers</h2>
              <div className="grid promo-grid">
                {PROMO_BANNERS.map((banner) => (
                  <article key={banner.id} className="promo-card" style={{ background: banner.bg }}>
                    <div className="promo-content">
                      <span className="promo-badge" style={{ background: banner.accent }}>{banner.badge}</span>
                      <h3>{banner.headline}</h3>
                      <p>{banner.description}</p>
                      <Link href={banner.link} className="btn btn-primary" style={{ background: banner.accent, borderColor: banner.accent }}> {banner.cta} </Link>
                    </div>
                    <div className="promo-visual">
                      <img src={banner.image} alt={banner.headline} className="promo-image" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>

          {/* BEST SELLERS */}
          <section className="section soft" aria-labelledby="bestsellers-heading">
            <div className="container">
              <div className="section-head">
                <div>
                  <div className="kicker">Popular</div>
                  <h2 id="bestsellers-heading">Best Sellers</h2>
                </div>
                <Link href="/shop" className="btn btn-outline">Shop all</Link>
              </div>
              <ProductGrid products={products.slice(0, 8)} />
            </div>
          </section>

          {/* WHY PURE ROOTS */}
          <section className="section" aria-labelledby="why-heading">
            <div className="container">
              <div className="section-head">
                <div>
                  <div className="kicker">Why Pure Roots</div>
                  <h2 id="why-heading">Simple standards. Thoughtful nutrition.</h2>
                </div>
              </div>
              <div className="grid benefits">
                {[
                  "✓ Quality Focused",
                  "✦ Premium Ingredients",
                  "◌ Freshly Packed",
                  "♡ Trusted Products",
                  "→ Fast Delivery",
                  "▣ Secure Payment",
                ].map((x) => (
                  <div className="benefit" key={x}>
                    <span>{x.slice(0, 1)}</span>
                    <strong>{x.slice(2)}</strong>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* STORY & REVIEWS SPLIT */}
          <section className="section soft" aria-labelledby="story-heading">
            <div className="container split">
              <div className="story-box">
                <div className="kicker">Healthy living</div>
                <h2 id="story-heading">Make everyday food more nourishing.</h2>
                <p className="muted">
                  Nuts and seeds can add texture and plant-based nutrients to breakfast bowls, salads and snacks. Natural spices
                  bring aroma and flavour, while honey adds natural sweetness.
                </p>
                <Link href="/about" className="btn btn-primary">Our story</Link>
              </div>
              <div>
                <div className="kicker">Customer voice</div>
                <h2 className="serif">Pure Nutrition Everyday</h2>
                <p className="quote">
                  "Every batch of nuts and honey is pure, aromatic, and fresh. Ordering through Pure Roots has become part of our family's health routine."
                </p>
                <Link href="/reviews" className="btn btn-outline">View Reviews</Link>
              </div>
            </div>
          </section>

          {/* NEWSLETTER */}
          <section className="section" aria-labelledby="newsletter-heading">
            <div className="container">
              <div className="newsletter">
                <div className="kicker" style={{ color: "#C9A45C" }}>
                  Stay in the loop
                </div>
                <h2 id="newsletter-heading">Get nutrition tips, new product updates & special offers.</h2>
                <NewsletterForm />
              </div>
            </div>
          </section>
        </>
      )}
    </>
  );
}