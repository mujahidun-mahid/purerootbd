import Link from "next/link";

export default function PromoCards({ cards = [] }) {
  if (!cards.length) return null;
  return (
    <section className="section promo-cards-section" aria-label="Promotional offers">
      <div className="container promo-cards-grid">
        {cards.map((card) => (
          <article
            key={card.id}
            className="promo-cards-card"
            style={card.background_color ? { background: card.background_color } : undefined}
          >
            <div className="promo-cards-copy">
              {card.discount_text && (
                <span className="promo-cards-badge">{card.discount_text}</span>
              )}
              <h3>{card.title}</h3>
              {card.description && <p className="muted">{card.description}</p>}
              <Link className="btn btn-primary" href={card.button_link || "/shop"}>
                {card.button_text || "Shop Now"} →
              </Link>
            </div>
            <div className="promo-cards-art" aria-hidden="true">
              {card.background_image ? (
                <img src={card.background_image} alt="" loading="lazy" />
              ) : (
                <span className="promo-cards-fallback">✦</span>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
