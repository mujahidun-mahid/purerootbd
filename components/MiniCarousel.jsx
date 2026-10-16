"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { safeHref } from "@/lib/safeUrl";

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

export default function MiniCarousel({ banner }) {
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
                <p className="muted">{s.description || banner.description || ""}</p>
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
