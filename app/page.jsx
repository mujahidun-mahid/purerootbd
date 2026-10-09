import Link from "next/link";
import ProductGrid from "@/components/ProductGrid";
import { loadProducts, loadCategories } from "@/lib/products-server";
import { getPage } from "@/lib/pages";
import { sectionRenderers } from "@/components/PageSections";
import NewsletterForm from "@/components/NewsletterForm";
import CategoryGrid from "@/components/home/CategoryGrid";
import PromoBanner from "@/components/home/PromoBanner";
import DealsSection from "@/components/home/DealsSection";
import MobileSplash from "@/components/home/MobileSplash";
import ComboCarousel from "@/components/home/ComboCarousel";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [page, products, categories] = await Promise.all([
    getPage("home"),
    loadProducts(),
    loadCategories({ featuredOnly: true }),
  ]);

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
          <MobileSplash />
          {/* HERO SECTION - Split 2-Column Grid (desktop) */}
          <section className="hero-section desktop-only" aria-labelledby="hero-heading">
            <div className="container hero-grid">
              <div className="hero-content">
                <div className="kicker">Fresh Grocery Delivery</div>
                <h1 id="hero-heading" className="serif">
                  Make healthy life with <span className="highlight">fresh</span> grocery
                </h1>
                <p className="hero-desc">Premium quality, farm-to-table freshness delivered to your doorstep. 100% organic, sustainably sourced.</p>
                <Link href="/shop" className="btn btn-primary btn-lg">Shop now</Link>
              </div>
              <div className="hero-visual">
                <div className="hero-image-wrapper">
                  <img src="/images/hero/grocery-bag.png" alt="Box filled with fresh produce on a soft cream background" className="hero-image" />
                </div>
              </div>
            </div>
          </section>

          <CategoryGrid />
          <ComboCarousel />
          <PromoBanner />
          <DealsSection products={products} />

          {/* FEATURED PRODUCTS GRID (4 per row desktop, 2 per row mobile) */}
          <section className="section soft" aria-labelledby="bestsellers-heading">
            <div className="container">
              <div className="section-head">
                <div>
                  <div className="kicker">Popular</div>
                  <h2 id="bestsellers-heading">Featured Products</h2>
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
