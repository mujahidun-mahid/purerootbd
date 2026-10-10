"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";

function usePerView() {
  const [perView, setPerView] = useState(1);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setPerView(mq.matches ? 2 : 1);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return perView;
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

function PromoCard({ card }) {
  const tint = card.background_color || "#FFFDF9";
  return (
    <article
      className="promo-cards-card"
      style={{ background: tint, "--tint": tint }}
    >
      {card.background_image ? (
        <div className="promo-cards-bg" aria-hidden="true">
          <img src={card.background_image} alt="" loading="lazy" />
          <span className="promo-cards-shade" />
        </div>
      ) : (
        <span className="promo-cards-fallback" aria-hidden="true">✦</span>
      )}
      <div className="promo-cards-copy">
        {card.discount_text && (
          <span className="promo-cards-badge">{card.discount_text}</span>
        )}
        <h3>{card.title}</h3>
        {card.description && <p className="muted">{card.description}</p>}
        <Link className="btn btn-primary" href={card.button_link || "/shop"}>
          {card.button_text || "Shop Now"} <ArrowRight size={16} />
        </Link>
      </div>
    </article>
  );
}

export default function PromoCards({ cards = [], carousel = { enabled: true, autoplay: false, interval: 6000 } }) {
  const perView = usePerView();
  const reducedMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef(null);
  const pages = Math.max(1, cards.length - perView + 1);
  const isMobile = perView === 1;
  // Mobile always autoplays (6s default); desktop/tablet follow the admin toggle.
  const autoplayOn = pages > 1 && !reducedMotion && (isMobile ? true : carousel.autoplay);

  useEffect(() => {
    setIndex((i) => Math.min(i, pages - 1));
  }, [pages, perView, cards.length]);

  const go = useCallback(
    (dir) => {
      setIndex((i) => (i + dir + pages) % pages);
    },
    [pages]
  );

  useEffect(() => {
    if (!autoplayOn || paused) return;
    const ms = Math.max(2000, Number(carousel.interval) || 6000);
    const id = setInterval(() => go(1), ms);
    return () => clearInterval(id);
  }, [autoplayOn, carousel.interval, paused, pages, go, index]);

  if (!cards.length) return null;

  const onTouchStart = (e) => {
    touchX.current = e.touches[0].clientX;
    setPaused(true);
  };
  const onTouchEnd = (e) => {
    if (touchX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    touchX.current = null;
    setPaused(false);
    if (dx > 40) go(-1);
    else if (dx < -40) go(1);
  };

  const body = (withChrome) => (
    <div
      className="promo-viewport"
      onTouchStart={withChrome ? onTouchStart : undefined}
      onTouchEnd={withChrome ? onTouchEnd : undefined}
      onMouseEnter={withChrome ? () => setPaused(true) : undefined}
      onMouseLeave={withChrome ? () => setPaused(false) : undefined}
    >
      <div
        className="promo-track"
        style={withChrome ? { transform: `translateX(-${index * (100 / perView)}%)` } : undefined}
      >
        {cards.map((card) => (
          <div className="promo-slide" key={card.id}>
            <PromoCard card={card} />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <section className="section promo-cards-section" aria-label="Promotional offers">
      <div className="container">
        {!carousel.enabled || pages <= 1 ? (
          <div className="promo-cards-grid">{cards.map((card) => <PromoCard key={card.id} card={card} />)}</div>
        ) : (
          <div className="promo-carousel">
            {body(true)}
            <div className="promo-nav">
              <div className="promo-arrows">
                <button type="button" className="iconbtn promo-arrow" onClick={() => go(-1)} aria-label="Previous banners">
                  <ChevronLeft size={20} />
                </button>
                <button type="button" className="iconbtn promo-arrow" onClick={() => go(1)} aria-label="Next banners">
                  <ChevronRight size={20} />
                </button>
              </div>
              <div className="promo-dots" role="tablist" aria-label="Banner pages">
                {Array.from({ length: pages }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    role="tab"
                    aria-selected={index === i}
                    aria-label={`Go to banner page ${i + 1}`}
                    className={`promo-dot${index === i ? " active" : ""}`}
                    onClick={() => setIndex(i)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
