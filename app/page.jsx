import Link from "next/link";
import FeaturedProducts from "@/components/FeaturedProducts";
import CategoryStrip from "@/components/CategoryStrip";
import PromoGrid, { parsePromoBanners } from "@/components/PromoGrid";
import { loadProducts, loadCategories } from "@/lib/products-server";
import { getSiteSettings } from "@/lib/site-settings";
import NewsletterForm from "@/components/NewsletterForm";

export const dynamic = 'force-dynamic';

function parseIds(raw) {
  if (Array.isArray(raw)) return raw;
  return String(raw || "").split(",").map((s) => s.trim()).filter(Boolean);
}

export default async function Home() {
  const settings = await getSiteSettings();
  const products = await loadProducts();
  const categories = await loadCategories({ featuredOnly: true });
  const banners = parsePromoBanners(settings.promo_banners);
  const counts = {};
  products.forEach((p) => {
    if (p.category) counts[p.category] = (counts[p.category] || 0) + 1;
  });
  const hero = {
    eyebrow: settings.hero_eyebrow || "",
    title: settings.hero_title || "Nature’s Nutrition, Delivered Pure",
    subtitle: settings.hero_subtitle || "",
    image: settings.hero_image_url || "",
    offer: settings.hero_offer || "",
    cta_text: settings.hero_cta_text || "Shop Now",
    cta_link: settings.hero_cta_link || "/shop",
    secondary_text: settings.hero_secondary_text || "",
    secondary_link: settings.hero_secondary_link || "",
  };
  const featuredIds = parseIds(settings.featured_product_ids);
  const featuredLimit = Math.max(1, parseInt(settings.featured_limit, 10) || 10);

  return (
    <>
      {(settings.category_strip_enabled ?? "true") !== "false" && (
        <CategoryStrip categories={categories} counts={counts} />
      )}

      <PromoGrid hero={hero} banners={banners} />

      <section className="section feat-cat-section" aria-labelledby="feat-cat-h">
        <div className="container">
          <div className="feat-cat-head">
            <h2 id="feat-cat-h">Featured Categories</h2>
            <Link className="feat-cat-all" href="/shop">
              View All Category
            </Link>
          </div>
          <div className="feat-cat-grid">
            {categories.map((c) => (
              <Link className="feat-cat" href={`/category/${c.slug}`} key={c.slug}>
                <div className="feat-cat-box">
                  {c.image ? (
                    <img src={c.image} alt={c.name} loading="lazy" />
                  ) : (
                    <span className="feat-cat-icon" aria-hidden="true">{c.icon}</span>
                  )}
                </div>
                <strong className="feat-cat-label">{c.name}</strong>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <FeaturedProducts
        products={products}
        limit={featuredLimit}
        title={settings.featured_title || "Featured Products"}
        subtitle={settings.featured_subtitle || ""}
        enabled={(settings.featured_enabled ?? "true") !== "false"}
        productIds={featuredIds}
      />

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
              "▣ Secure Payment"
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
              “Every batch of nuts and honey is pure, aromatic, and fresh. Ordering through Pure Roots has become part of our family’s health routine.”
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
  );
}
