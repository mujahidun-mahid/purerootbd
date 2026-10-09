"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, UserRound, Heart, ShoppingBag, Menu, X, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useStore } from "./StoreProvider";
import { useSiteSettings } from "./SiteSettingsProvider";

const CATEGORIES = [
  { label: "All Categories", value: "" },
  { label: "Fruits", value: "fruits" },
  { label: "Vegetables", value: "vegetables" },
  { label: "Beverages", value: "beverages" },
  { label: "Fresh Meat", value: "fresh-meat" },
  { label: "Fresh Fish", value: "fresh-fish" },
  { label: "Bakery", value: "bakery" },
  { label: "Grocery", value: "grocery" },
];

const SUB_NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "Fruits", href: "/category/fruits" },
  { label: "Vegetable", href: "/category/vegetables" },
  { label: "Beverages", href: "/category/beverages" },
  { label: "About Us", href: "/about" },
  { label: "Blogs", href: "/blogs" },
];

export default function Header() {
  const pathname = usePathname();
  const { cartCount } = useStore();
  const { settings } = useSiteSettings();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchCategory, setSearchCategory] = useState("");
  const close = () => setOpen(false);

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  const siteName = settings.site_name || "agora";
  const tagline = settings.site_tagline || "";
  const showAnnouncement =
    settings.announcement_enabled === "true" && String(settings.announcement || "").trim() !== "";

  return (
    <>
      {showAnnouncement && (
        <div className="announcement-bar" role="status">
          <div className="container">{settings.announcement}</div>
        </div>
      )}
      <header className="header">
        {/* Top Navigation Bar */}
        <div className="top-nav" role="navigation" aria-label="Main navigation">
          <div className="container top-nav-inner">
            <Link href="/" className="logo-main" aria-label={`${siteName} home`}>
              <span className="logo-text">{siteName}</span>
              {tagline && <span className="logo-tagline">{tagline}</span>}
            </Link>

            <div className="search-bar" role="search">
              <div className="search-category-wrapper">
                <select
                  value={searchCategory}
                  onChange={(e) => setSearchCategory(e.target.value)}
                  className="search-category"
                  aria-label="Filter by category"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
              <div className="search-input-wrapper">
                <input
                  type="search"
                  placeholder="Search products..."
                  className="search-input"
                  autoComplete="off"
                />
                <button type="submit" className="search-btn" aria-label="Search">
                  <Search size={20} />
                </button>
              </div>
            </div>

            <nav className="nav-actions" aria-label="User actions">
              <Link href="/account" className="iconbtn" aria-label="Account">
                <UserRound size={20} />
              </Link>
              <Link href="/wishlist" className="iconbtn" aria-label="Wishlist">
                <Heart size={20} />
              </Link>
              <Link href="/cart" className="iconbtn" aria-label="Cart">
                <ShoppingBag size={20} />
                {cartCount > 0 && <span className="badge">{cartCount}</span>}
              </Link>
              <button className="iconbtn mobileMenu" onClick={() => setOpen((v) => !v)} aria-label={open ? "Close menu" : "Open menu"}>
                {open ? <X size={20} /> : <Menu size={20} />}
              </button>
            </nav>
          </div>
        </div>

        {/* Sub Navigation Bar */}
        <nav className="sub-nav" aria-label="Category navigation">
          <div className="container sub-nav-inner">
            {SUB_NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="sub-nav-link" aria-current={pathname === link.href ? "page" : undefined}>
                {link.label}
              </Link>
            ))}
          </div>
        </nav>

        {open && (
          <nav className="mobile-nav" aria-label="Mobile">
            <div className="mobile-search">
              <select value={searchCategory} onChange={(e) => setSearchCategory(e.target.value)} className="search-category">
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
              <div className="search-input-wrapper">
                <input type="search" placeholder="Search products..." className="search-input" />
                <button type="submit" className="search-btn" aria-label="Search"><Search size={20} /></button>
              </div>
            </div>
            {SUB_NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} onClick={close} className="mobile-nav-link">
                {link.label}
              </Link>
            ))}
            <Link href="/track-order" onClick={close} className="mobile-nav-link">Track Order</Link>
          </nav>
        )}
      </header>
    </>
  );
}