import Link from "next/link";
import ProductGrid from "@/components/ProductGrid";
import { loadProducts, loadCategories } from "@/lib/products-server";
import { getPage } from "@/lib/pages";
import { sectionRenderers } from "@/components/PageSections";
import NewsletterForm from "@/components/NewsletterForm";

export const dynamic = "force-dynamic";

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
          <section className="hero">
            <div className="container hero-grid">
              <div>
                <div className="kicker">{settings.site_name} · Bangladesh</div>
                <h1 className="serif">{settings.hero_title}</h1>
                <p>{settings.hero_subtitle}</p>
                <div className="hero-actions">
                  <Link className="btn btn-primary" href="/shop">
                    Shop Now
                  </Link>
                  <Link className="btn btn-outline" href="/category/nuts">
                    Explore Categories
                  </Link>
                </div>
              </div>
              <div
                className="hero-art"
                style={
                  settings.hero_image_url
                    ? {
                        backgroundImage: `url(${settings.hero_image_url})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }
                    : undefined
                }
              >
                {!settings.hero_image_url && (
                  <>
                    <div className="food a" />
                    <div className="food b" />
                    <div className="food c" />
                  </>
                )}
              </div>
            </div>
          </section>

          <section className="section">
            <div className="container">
              <div className="section-head">
                <div>
                  <div className="kicker">Explore</div>
                  <h2>Featured Categories</h2>
                </div>
                <Link className="btn btn-outline" href="/shop">
                  View all
                </Link>
              </div>
              <div className="grid cat-grid">
                {categories.map((c) => (
                  <Link className="cat" href={`/category/${c.slug}`} key={c.slug}>
                    {c.image ? (
                      <div className="cat-art">
                        <img src={c.image} alt={c.name} />
                      </div>
                    ) : (
                      <div className="cat-icon">{c.icon}</div>
                    )}
                    <strong>{c.name}</strong>
                    <span className="muted">{c.description}</span>
                  </Link>
                ))}
              </div>
            </div>
          </section>

          <section className="section soft">
            <div className="container">
              <div className="section-head">
                <div>
                  <div className="kicker">Popular</div>
                  <h2>Best Sellers</h2>
                </div>
                <Link className="btn btn-outline" href="/shop">
                  Shop all
                </Link>
              </div>
              <ProductGrid products={products.slice(0, 8)} />
            </div>
          </section>

          <section className="section">
            <div className="container">
              <div className="section-head">
                <div>
                  <div className="kicker">Why Pure Roots</div>
                  <h2>Simple standards. Thoughtful nutrition.</h2>
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

          <section className="section soft">
            <div className="container split">
              <div className="story-box">
                <div className="kicker">Healthy living</div>
                <h2>Make everyday food more nourishing.</h2>
                <p className="muted">
                  Nuts and seeds can add texture and plant-based nutrients to breakfast bowls, salads and snacks. Natural spices
                  bring aroma and flavour, while honey adds natural sweetness.
                </p>
                <Link className="btn btn-primary" href="/about">
                  Our story
                </Link>
              </div>
              <div>
                <div className="kicker">Customer voice</div>
                <h2 className="serif">Pure Nutrition Everyday</h2>
                <p className="quote">
                  "Every batch of nuts and honey is pure, aromatic, and fresh. Ordering through Pure Roots has become part of our family's health routine."
                </p>
                <Link href="/reviews" className="btn btn-outline">
                  View Reviews
                </Link>
              </div>
            </div>
          </section>

          <section className="section">
            <div className="container">
              <div className="newsletter">
                <div className="kicker" style={{ color: "#C9A45C" }}>
                  Stay in the loop
                </div>
                <h2>Get nutrition tips, new product updates & special offers.</h2>
                <NewsletterForm />
              </div>
            </div>
          </section>
        </>
      )}
    </>
  );
}