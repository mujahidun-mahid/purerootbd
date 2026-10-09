"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import ProductGrid from "../ProductGrid";

function getTimeLeft() {
  const now = new Date();
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const diff = Math.max(0, end.getTime() - now.getTime());
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff / 3600000) % 24),
    minutes: Math.floor((diff / 60000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export default function DealsSection({ products = [] }) {
  const [t, setT] = useState(getTimeLeft());
  useEffect(() => {
    const id = setInterval(() => setT(getTimeLeft()), 1000);
    return () => clearInterval(id);
  }, []);

  const units = [
    { label: "Days", value: t.days },
    { label: "Hours", value: t.hours },
    { label: "Minutes", value: t.minutes },
    { label: "Seconds", value: t.seconds },
  ];

  return (
    <section className="section deals-section" aria-labelledby="deals-heading">
      <div className="container deals-card">
        <div className="deals-head">
          <div>
            <div className="kicker">Limited-Time Offer</div>
            <h2 id="deals-heading">Deals End Tonight</h2>
            <p className="muted">Fresh picks at fresh prices. While stock lasts.</p>
          </div>
          <div className="countdown" role="timer" aria-label="Deal countdown timer">
            {units.map((u) => (
              <div key={u.label} className="count-box">
                <strong>{String(u.value).padStart(2, "0")}</strong>
                <small>{u.label}</small>
              </div>
            ))}
          </div>
          <Link href="/shop" className="btn btn-primary">Shop deals</Link>
        </div>
        <ProductGrid products={products.slice(0, 4)} />
      </div>
    </section>
  );
}
