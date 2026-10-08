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

  return { products: items || fallbackProducts, loading: items === null };
}
