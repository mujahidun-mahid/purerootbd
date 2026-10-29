"use client";
import { useEffect, useState } from "react";
import { products as fallbackProducts } from "@/lib/products";

export function useProducts() {
  const [items, setItems] = useState(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/products", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (alive && d && Array.isArray(d.products)) setItems(d.products);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // Demo products are only a development fallback. In production show the
  // real API result (including an empty catalog while data loads) so demo
  // items never appear on the live storefront.
  const fallback = process.env.NODE_ENV === "production" ? [] : fallbackProducts;
  return { products: items || fallback, loading: items === null };
}
