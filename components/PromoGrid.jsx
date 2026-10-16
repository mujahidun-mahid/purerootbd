import Link from "next/link";
import { safeHref } from "@/lib/safeUrl";
import { DEFAULT_PROMO_BANNERS, parseHeroBanners, isRemovedPromoBanner } from "@/lib/hero-offers";
import MiniCarousel from "@/components/MiniCarousel";

export { DEFAULT_PROMO_BANNERS };

export function parsePromoBanners(raw) {
  if (!raw) return [...DEFAULT_PROMO_BANNERS];
  return parseHeroBanners(raw).filter((b) => b.enabled && !isRemovedPromoBanner(b));
}

function BannerArt({ banner, large }) {
  if (banner.image) {
    return <img src={banner.image} alt="" loading={large ? "eager" : "lazy"} />;
  }
  return <span className="promo-art-fallback" aria-hidden="true">✦</span>;
}

function SideCard({ banner }) {
  const hasSlides = Array.isArray(banner.slides) && banner.slides.length > 1;
  return (
    <article className="promo-card" style={banner.bg ? { background: banner.bg } : undefined}>
      {banner.image && !hasSlides ? (
        <div className="promo-card-art" aria-hidden="true">
          <BannerArt banner={banner} />
        </div>
      ) : null}
      <div className="promo-card-copy">
        {banner.eyebrow && <div className="promo-eyebrow">{banner.eyebrow}</div>}
        {hasSlides ? (
          <MiniCarousel banner={banner} />
        ) : (
          <>
            <h3>{banner.title}</h3>
            {banner.badge && <span className="promo-badge">{banner.badge}</span>}
            {banner.description && <p className="muted">{banner.description}</p>}
            {banner.cta_link && (
              <Link className="promo-cta" href={safeHref(banner.cta_link)}>
                {banner.cta_text || "Shop Now"} →
              </Link>
            )}
          </>
        )}
      </div>
    </article>
  );
}

export default function PromoGrid({ hero, banners = [] }) {
  const list = (Array.isArray(banners) ? banners : []).filter(
    (b) => b && b.enabled !== false && !isRemovedPromoBanner(b)
  );
  return (
    <section className="section promo-grid-section" aria-label="Promotions">
      <div
        className="container promo-grid"
        style={list.length ? undefined : { gridTemplateColumns: "1fr" }}
      >
        <article className="promo-main">
          <div className="promo-main-copy">
            {hero.eyebrow && <div className="kicker">{hero.eyebrow}</div>}
            <h1 className="serif">{hero.title}</h1>
            {hero.subtitle && <p>{hero.subtitle}</p>}
            {hero.offer && <div className="promo-offer">{hero.offer}</div>}
            <div className="hero-actions">
              {hero.cta_link && (
                <Link className="btn btn-primary" href={safeHref(hero.cta_link)}>
                  {hero.cta_text || "Shop Now"}
                </Link>
              )}
              {hero.secondary_link && (
                <Link className="btn btn-outline" href={safeHref(hero.secondary_link)}>
                  {hero.secondary_text || "Learn More"}
                </Link>
              )}
            </div>
          </div>
          <div
            className="promo-main-art"
            style={
              hero.image
                ? { backgroundImage: `url(${hero.image})`, backgroundSize: "cover", backgroundPosition: "center" }
                : undefined
            }
          >
            {!hero.image && (
              <>
                <div className="food a" />
                <div className="food b" />
                <div className="food c" />
              </>
            )}
          </div>
        </article>

        {list.length > 0 && (
          <div className="promo-side">
            {list.map((b) => (
              <SideCard key={b.id || b.title} banner={b} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
