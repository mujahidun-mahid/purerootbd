import Link from "next/link";

export const DEFAULT_PROMO_BANNERS = [
  {
    id: "promo-new",
    slot: "secondary1",
    eyebrow: "Just Landed",
    title: "New Arrivals",
    description: "Fresh picks added to the shelves this week.",
    image: "",
    cta_text: "Explore",
    cta_link: "/shop",
    bg: "",
    enabled: true,
    order: 1,
  },
  {
    id: "promo-deals",
    slot: "secondary2",
    eyebrow: "While Stock Lasts",
    title: "Limited-Time Offers",
    description: "Special prices on customer favourites.",
    image: "",
    cta_text: "Grab Deals",
    cta_link: "/shop",
    bg: "",
    enabled: true,
    order: 2,
  },
  {
    id: "promo-collections",
    slot: "secondary3",
    eyebrow: "Curated For You",
    title: "Featured Collections",
    description: "Bundles for everyday wellness routines.",
    image: "",
    cta_text: "View More",
    cta_link: "/shop",
    bg: "",
    enabled: true,
    order: 3,
  },
];

export function parsePromoBanners(raw) {
  if (!raw) return [...DEFAULT_PROMO_BANNERS];
  try {
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return [...DEFAULT_PROMO_BANNERS];
    return list
      .filter((b) => b && b.enabled !== false && b.title)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .slice(0, 3);
  } catch {
    return [...DEFAULT_PROMO_BANNERS];
  }
}

function BannerArt({ banner, large }) {
  if (banner.image) {
    return <img src={banner.image} alt="" loading={large ? "eager" : "lazy"} />;
  }
  return <span className="promo-art-fallback" aria-hidden="true">✦</span>;
}

export default function PromoGrid({ hero, banners = [] }) {
  const list = banners.length ? banners : [...DEFAULT_PROMO_BANNERS];
  return (
    <section className="section promo-grid-section" aria-label="Promotions">
      <div className="container promo-grid">
        <article className="promo-main">
          <div className="promo-main-copy">
            {hero.eyebrow && <div className="kicker">{hero.eyebrow}</div>}
            <h1 className="serif">{hero.title}</h1>
            {hero.subtitle && <p>{hero.subtitle}</p>}
            {hero.offer && <div className="promo-offer">{hero.offer}</div>}
            <div className="hero-actions">
              {hero.cta_link && (
                <Link className="btn btn-primary" href={hero.cta_link}>
                  {hero.cta_text || "Shop Now"}
                </Link>
              )}
              {hero.secondary_link && (
                <Link className="btn btn-outline" href={hero.secondary_link}>
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

        <div className="promo-side">
          {list.map((b) => (
            <article className="promo-card" key={b.id || b.title} style={b.bg ? { background: b.bg } : undefined}>
              {b.image && (
                <div className="promo-card-art" aria-hidden="true">
                  <BannerArt banner={b} />
                </div>
              )}
              <div className="promo-card-copy">
                {b.eyebrow && <div className="promo-eyebrow">{b.eyebrow}</div>}
                <h3>{b.title}</h3>
                {b.description && <p className="muted">{b.description}</p>}
                {b.cta_link && (
                  <Link className="promo-cta" href={b.cta_link}>
                    {b.cta_text || "Shop Now"} →
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
