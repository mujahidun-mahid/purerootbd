import Link from "next/link";
import { safeHref } from "@/lib/safeUrl";

export default function MobilePromoBanner({ hero, card }) {
  const title = hero?.title || card?.title || "Nature’s Nutrition, Delivered Pure";
  const subtitle = hero?.subtitle || card?.description || "";
  const offer = hero?.offer || card?.discount_text || "";
  const ctaText = hero?.cta_text || card?.button_text || "Shop Now";
  const ctaLink = hero?.cta_link || card?.button_link || "/shop";
  const image = hero?.image || card?.background_image || "";

  return (
    <section className="m-promo-wrap" aria-label="Featured promotion">
      <div className="container">
        <article className="m-promo">
          <div className="m-promo-copy">
            {offer ? <span className="m-promo-offer">{offer}</span> : null}
            <h2 className="m-promo-title">{title}</h2>
            {subtitle ? <p className="m-promo-sub">{subtitle}</p> : null}
            <Link className="m-promo-cta" href={safeHref(ctaLink)}>
              {ctaText} →
            </Link>
          </div>
          <div className="m-promo-art" aria-hidden="true">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt="" loading="eager" />
            ) : (
              <>
                <span className="m-promo-orb a" />
                <span className="m-promo-orb b" />
              </>
            )}
          </div>
        </article>
      </div>
    </section>
  );
}
