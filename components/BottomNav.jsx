"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "./StoreProvider";
import { Home, Grid, ShoppingBag, Search } from "lucide-react";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/shop", label: "Menu", icon: Grid },
  { href: "/cart", label: "Cart", icon: ShoppingBag, showBadge: true },
  { href: "/search", label: "Search", icon: Search },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { cartCount } = useStore();

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  const isActive = (href) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <nav className="bottom-nav" role="navigation" aria-label="Main navigation">
      {navItems.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`bottom-nav-item ${active ? "active" : ""}`}
            aria-current={active ? "page" : undefined}
            aria-label={item.label}
          >
            <span className="bottom-nav-icon" aria-hidden="true">
              <item.icon size={22} strokeWidth={active ? 2.5 : 2} />
            </span>
            <span className="bottom-nav-label">{item.label}</span>
            {item.showBadge && cartCount > 0 && (
              <span className="bottom-nav-badge" aria-label={`${cartCount} items in cart`}>
                {cartCount}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}