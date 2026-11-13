"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Heart, Share2, Minus, Plus } from "lucide-react";
import { useStore } from "@/components/StoreProvider";
import ProductGrid from "@/components/ProductGrid";

function orbClass(category) {
  if (category === "honey") return "honey";
  if (category === "spices") return "spice";
  if (String(category || "").includes("seed") || category === "seeds") return "seed";
  return "nut";
}

function prettyCategory(slug) {
  return String(slug || "")
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function ProductDetails({ product, related }) {
  const router = useRouter();
  const { add, buyNow, wishlist, toggleWish } = useStore();
  const defaultSize = (pkgList) => pkgList && pkgList.length ? pkgList[Math.min(1, pkgList.length - 1)].size : "";
  const [size, setSize] = useState(() => defaultSize(product?.packages));
  const [qty, setQty] = useState(1);
  const [photo, setPhoto] = useState(0);

  useEffect(() => { setPhoto(0); }, [product?.slug]);

  const gallery = product && Array.isArray(product.images) && product.images.length ? product.images : (product?.image ? [product.image] : []);
  const current = gallery[Math.min(photo, Math.max(0, gallery.length - 1))];

  useEffect(() => {
    if (product?.packages?.length && !product.packages.some((x) => x.size === size)) setSize(defaultSize(product.packages));
  }, [product]);

  const pkg = product.packages.find((x) => x.size === size) || product.packages[0];

  return (
    <>
      <div className="detail">
        <div>
          <div className="gallery-main">
            {current
              ? <img className="gallery-photo" src={current} alt={`${product.name} — photo ${Math.min(photo, gallery.length - 1) + 1}`} />
              : <div className={`orb ${orbClass(product.category)}`} />}
          </div>
          {gallery.length > 1 && (
            <div className="thumbs" role="tablist" aria-label="Product photos">
              {gallery.map((src, i) => (
                <button
                  key={`${src}-${i}`}
                  type="button"
                  role="tab"
                  aria-selected={i === photo}
                  aria-label={`View photo ${i + 1} of ${gallery.length}`}
                  className={`thumb thumb-btn${i === photo ? " active" : ""}`}
                  onClick={() => setPhoto(i)}
                >
                  <img src={src} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <div className="kicker">{prettyCategory(product.category)}</div>
          <h1 className="serif">{product.name}</h1>
          <div className="detail-price">৳{pkg.price.toLocaleString()} {product.oldPrice && <span className="old">৳{product.oldPrice.toLocaleString()}</span>}</div>
          <p className="muted">{product.short}</p>
          <div style={{ margin: "22px 0" }}>
            <label>Package size</label>
            <div className="options">
              {product.packages.map((o) => (
                <button key={o.size} className={`option ${size === o.size ? "active" : ""}`} onClick={() => setSize(o.size)}>
                  {o.size} · ৳{o.price}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 14 }}>
            <label style={{ margin: 0 }}>Quantity</label>
            <div className="qty">
              <button onClick={() => setQty(Math.max(1, qty - 1))}><Minus size={15} /></button>
              <span>{qty}</span>
              <button onClick={() => setQty(qty + 1)}><Plus size={15} /></button>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="btn btn-primary" onClick={() => add(product, size, qty, current)}>
              Add to Cart
            </button>
            <button className="btn btn-gold" onClick={() => { buyNow(product, size, qty, current); router.push("/checkout"); }}>
              Buy Now
            </button>
            <button className="iconbtn" onClick={() => toggleWish(product.slug)}>
              <Heart fill={wishlist.includes(product.slug) ? "currentColor" : "none"} />
            </button>
            <button className="iconbtn">
              <Share2 />
            </button>
          </div>
          <div className="notice" style={{ marginTop: 20 }}>
            Delivery in Bangladesh · Delivery charge calculated at checkout.
          </div>
        </div>
      </div>

      <div className="tabs">
        <div className="tab">
          <h3>Product Description</h3>
          <p className="muted">{product.description}</p>
        </div>
      </div>

      {related.length > 0 && (
        <section className="section">
          <div className="section-head">
            <h2>Related Products</h2>
          </div>
          <ProductGrid products={related} />
        </section>
      )}
    </>
  );
}
