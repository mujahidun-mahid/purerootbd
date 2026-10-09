"use client";
import Link from "next/link";
import { useState } from "react";
import { Heart, ShoppingBasket } from "lucide-react";
import { useStore } from "./StoreProvider";

function prettyCategory(slug) {
  return String(slug || "")
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function orbClass(category) {
  if (["spices"].includes(category)) return "spice";
  if (category === "honey") return "honey";
  if (String(category || "").includes("seed")) return "seed";
  return "nut";
}

export default function ProductCard({ product }) {
  const { add, wishlist, toggleWish } = useStore();
  const active = wishlist.includes(product.slug);
  const packages = Array.isArray(product.packages) && product.packages.length
    ? product.packages
    : [{ size: "500g", price: product.price }];
  const [size, setSize] = useState(packages[0].size);
  const selected = packages.find((p) => p.size === size) || packages[0];

  const basePrice = Number(product.price) || 0;
  const baseOld = product.oldPrice === null || product.oldPrice === undefined ? null : Number(product.oldPrice);
  const oldPrice = baseOld && basePrice ? Math.round((baseOld / basePrice) * Number(selected.price)) : null;
  const discount = oldPrice && oldPrice > selected.price
    ? Math.round((1 - Number(selected.price) / oldPrice) * 100)
    : 0;

  const fullStars = Math.round(Number(product.rating) || 0);

  return (
    <article className="fp-card">
      <div className="fp-card-top">
        <span className="fp-cat">{prettyCategory(product.category)}</span>
        <button
          type="button"
          className={`fp-wish${active ? " active" : ""}`}
          onClick={() => toggleWish(product.slug)}
          aria-label={active ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
          aria-pressed={active}
        >
          <Heart size={17} fill={active ? "currentColor" : "none"} />
        </button>
      </div>

      <Link href={`/product/${product.slug}`} className="fp-img" aria-label={product.name}>
        {product.image ? (
          <img className="product-photo" src={product.image} alt={product.name} loading="lazy" />
        ) : (
          <div className={`orb ${orbClass(product.category)}`} />
        )}
      </Link>

      {packages.length > 1 && (
        <div className="fp-variants" role="group" aria-label="Available sizes">
          {packages.map((p) => (
            <button
              key={p.size}
              type="button"
              className={`fp-variant${p.size === size ? " active" : ""}`}
              onClick={() => setSize(p.size)}
              aria-pressed={p.size === size}
            >
              {p.size}
            </button>
          ))}
        </div>
      )}

      <div className="fp-price-row">
        <span className="fp-price">৳{Number(selected.price).toLocaleString()}</span>
        {oldPrice && <span className="fp-old">৳{oldPrice.toLocaleString()}</span>}
        {discount > 0 && <span className="fp-off">-{discount}%</span>}
      </div>

      <Link href={`/product/${product.slug}`} className="fp-title" title={product.name}>
        {product.name}
      </Link>

      <div className="fp-rating" aria-label={`Rated ${product.rating} out of 5`}>
        <span className="fp-stars" aria-hidden="true">
          {[1, 2, 3, 4, 5].map((i) => (
            <span key={i} className={i <= fullStars ? "on" : ""}>★</span>
          ))}
        </span>
        <span className="fp-score">({Number(product.rating || 0).toFixed(2)})</span>
      </div>

      <button type="button" className="fp-cta" onClick={() => add(product, selected.size)}>
        <ShoppingBasket size={16} /> Select Options
      </button>
    </article>
  );
}
