"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { safeHref } from "@/lib/safeUrl";
import { DEFAULT_PROMO_BANNERS, parseHeroBanners } from "@/lib/hero-offers";

export { DEFAULT_PROMO_BANNERS };

export function parsePromoBanners(raw) {
  if (!raw) return [...DEFAULT_PROMO_BANNERS];
  const list = parseHeroBanners(raw).filter((b) => b.enabled);
  return list.length ? list : [...DEFAULT_PROMO_BANNERS];
}

function BannerArt({ banner, large }) {
  if (banner.image) {
    return <img src={banner.image} alt="" loading={large ? "eager" : "lazy"} />;
  }
  return <span className="promo-art-fallback" aria-hidden="true">✦</span>;
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}

function MiniCarousel({ banner }) {
  const slides = Array.isArray(banner.slides) && banner.slides.length > 1
    ? banner.slides
    : null;
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef(null);

  const count = slides ? slides.length : 0;
  const go = useCallback(
    (dir) => setIndex((i) => (i + dir + count) % count),
    [count]
  );

  useEffect(() => {
    if (!slides || reduced || paused || count <= 1) return;
    const id = setInterval(() => go(1), 5000);
    return () => clearInterval(id);
  }, [slides, reduced, paused, count, go, index]);

  if (!slides) return null;

  const onTouchStart = (e) => {
    touchX.current = e.touches[0].clientX;
    setPaused(true);
  };
  const onTouchEnd = (e) => {
    if (touchX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    touchX.current = null;
    setPaused(false);
    if (dx > 35) go(-1);
    else if (dx < -35) go(1);
  };

  return (
    <div
      className="mini-carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="mini-viewport">
        <div
          className="mini-track"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {slides.map((s, i) => {
            const ctaLink = s.cta_link || banner.cta_link || "/shop";
            const ctaText = s.cta_text || banner.cta_text || "Shop Now";
            return (
              <div className="mini-slide" key={i} aria-hidden={i !== index}>
                {s.image ? (
                  <div className="mini-slide-art" aria-hidden="true">
                    <img src={s.image} alt="" loading="lazy" />
                  </div>
                ) : null}
                <h3>{s.title || banner.title}</h3>
                {s.badge ? <span className="promo-badge">{s.badge}</span> : null}
                {(s.description || banner.description) && i === index ? (
                  <p className="muted">{s.description || banner.description}</p>
                ) : (
                  <p className="muted" aria-hidden="true" style={{ visibility: "hidden", height: 0, margin: 0 }}>
                    placeholder
                  </p>
                )}
                {ctaLink ? (
                  <Link className="promo-cta" href={safeHref(ctaLink)} tabIndex={i === index ? 0 : -1}>
                    {ctaText} →
                  </Link>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
      <div className="mini-nav">
        <div className="mini-dots" role="tablist" aria-label={`${banner.title} slides`}>
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={index === i}
              aria-label={`Go to slide ${i + 1}`}
              className={`mini-dot${index === i ? " active" : ""}`}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
        <div className="mini-arrows">
          <button type="button" className="mini-arrow" onClick={() => go(-1)} aria-label={`Previous ${banner.title} slide`}>
            ‹
          </button>
          <button type="button" className="mini-arrow" onClick={() => go(1)} aria-label={`Next ${banner.title} slide`}>
            ›
          </button>
        </div>
      </div>
    </div>
  );
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

        <div className="promo-side">
          {list.map((b) => (
            <SideCard key={b.id || b.title} banner={b} />
          ))}
        </div>
      </div>
    </section>
  );
}
