"use client";
import Link from "next/link";
import { Search, UserRound, Heart, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { useStore } from "../StoreProvider";
import { useSiteSettings } from "../SiteSettingsProvider";

export const HEADER_CATEGORIES = [
  { label: "All Categories", value: "" },
  { label: "Fruits", value: "fruits" },
  { label: "Vegetables", value: "vegetables" },
  { label: "Beverages", value: "beverages" },
  { label: "Fresh Meat", value: "fresh-meat" },
  { label: "Fresh Fish", value: "fresh-fish" },
  { label: "Bakery", value: "bakery" },
  { label: "Grocery", value: "grocery" },
];

export const SUB_NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "Fruits", href: "/category/fruits" },
  { label: "Vegetable", href: "/category/vegetables" },
  { label: "Beverages", href: "/category/beverages" },
  { label: "About us", href: "/about" },
  { label: "Blogs", href: "/reviews" },
];

export default function DesktopHeader({ pathname }) {
  const { cartCount } = useStore();
  const { settings } = useSiteSettings();
  const [searchCategory, setSearchCategory] = useState("");
  const siteName = settings.site_name || "agora";

  return (
    <div className="desktop-header" role="navigation" aria-label="Desktop navigation">
      <div className="container top-nav-inner">
        <Link href="/" className="logo-main" aria-label={`${siteName} home`}>
          <span className="logo-text">{siteName}</span>
        </Link>
        <div className="search-bar" role="search">
          <div className="search-category-wrapper">
            <select value={searchCategory} onChange={(e) => setSearchCategory(e.target.value)} className="search-category" aria-label="Filter by category">
              {HEADER_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>
          <div className="search-input-wrapper">
            <input type="search" placeholder="Search products..." className="search-input" autoComplete="off" aria-label="Search products" />
            <button type="submit" className="search-btn" aria-label="Search"><Search size={20} /></button>
          </div>
        </div>
        <nav className="nav-actions" aria-label="User actions">
          <Link href="/wishlist" className="iconbtn" aria-label="Wishlist"><Heart size={20} /></Link>
          <Link href="/cart" className="iconbtn" aria-label="Cart">
            <ShoppingBag size={20} />
            {cartCount > 0 && <span className="badge">{cartCount}</span>}
          </Link>
          <Link href="/account" className="iconbtn" aria-label="User profile"><UserRound size={20} /></Link>
        </nav>
      </div>
      <nav className="sub-nav" aria-label="Category navigation">
        <div className="container sub-nav-inner">
          {SUB_NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="sub-nav-link" aria-current={pathname === link.href ? "page" : undefined}>
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
