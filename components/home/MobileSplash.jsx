import Link from "next/link";

export default function MobileSplash() {
  return (
    <section className="mobile-only mobile-splash" aria-labelledby="splash-heading">
      <div className="container mobile-splash-inner">
        <div className="mobile-splash-art" aria-hidden="true">
          <span className="splash-emoji e1">{"\u{1F96C}"}</span>
          <span className="splash-emoji e2">{"\u{1F34E}"}</span>
          <span className="splash-emoji e3">{"\u{1F951}"}</span>
          <span className="splash-emoji e4">{"\u{1F348}"}</span>
        </div>
        <h2 id="splash-heading">Pure Freshness in Every Tap</h2>
        <p>Farm-fresh groceries, combo deals and express delivery — made for your pocket.</p>
        <Link href="/shop" className="splash-cta" aria-label="Start shopping">{"->"}</Link>
      </div>
    </section>
  );
}
