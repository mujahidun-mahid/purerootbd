"use client";
import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";

const Ctx = createContext(null);
const CART_KEY = "pr-cart";
const WISHLIST_KEY = "pr-wishlist";
const ORDERS_KEY = "pr-orders";

function readJSON(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

export function StoreProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [orders, setOrders] = useState([]);
  const [hydrated, setHydrated] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    setCart(readJSON(CART_KEY, []));
    setWishlist(readJSON(WISHLIST_KEY, []));
    setOrders(readJSON(ORDERS_KEY, []));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart, hydrated]);

  useEffect(() => {
    if (hydrated) localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
  }, [wishlist, hydrated]);

  useEffect(() => {
    if (hydrated) localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  }, [orders, hydrated]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const showToast = useCallback((message, type = "success") => {
    setToast(message ? { message, type } : null);
  }, []);

  const add = useCallback((product, size = "500g", qty = 1) => {
    const pkg = product.packages?.find((x) => x.size === size) || product.packages?.[0] || { size: "500g", price: product.price || 0 };
    const amount = Math.max(1, Number(qty) || 1);
    const key = `${product.id}-${pkg.size}`;
    setCart((c) => {
      const found = c.find((x) => x.key === key);
      if (found) {
        return c.map((x) => (x.key === key ? { ...x, qty: x.qty + amount } : x));
      }
      return [
        ...c,
        {
          key,
          productId: product.id,
          slug: product.slug,
          name: product.name,
          size: pkg.size,
          price: pkg.price,
          qty: amount,
          imageType: product.category || "nuts"
        }
      ];
    });
    showToast(`${product.name} added to cart`);
    return key;
  }, [showToast]);

  const remove = useCallback((key) => {
    setCart((c) => c.filter((x) => x.key !== key));
  }, []);

  const update = useCallback((key, qty) => {
    setCart((c) => {
      if (qty <= 0) return c.filter((x) => x.key !== key);
      return c.map((x) => (x.key === key ? { ...x, qty } : x));
    });
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const toggleWish = useCallback((slug) => {
    setWishlist((w) => (w.includes(slug) ? w.filter((x) => x !== slug) : [...w, slug]));
  }, []);

  const saveOrderLocally = useCallback((saved) => {
    if (!saved) return;
    setOrders((current) => [saved, ...current.filter((x) => (x.order || x.order_number) !== (saved.order || saved.order_number))].slice(0, 50));
  }, []);

  const total = useMemo(() => cart.reduce((s, x) => s + Number(x.price || 0) * Number(x.qty || 1), 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((s, x) => s + Number(x.qty || 1), 0), [cart]);

  return (
    <Ctx.Provider
      value={{
        cart,
        cartCount,
        add,
        remove,
        update,
        clearCart,
        total,
        wishlist,
        toggleWish,
        orders,
        saveOrderLocally,
        hydrated,
        toast,
        showToast
      }}
    >
      {children}
      {toast && (
        <div className={`store-toast ${toast.type}`}>
          <span>{toast.type === "success" ? "✓" : "!"}</span>
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)}>✕</button>
        </div>
      )}
    </Ctx.Provider>
  );
}

export const useStore = () => useContext(Ctx);
