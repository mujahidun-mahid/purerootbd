"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, UserRound, Heart, ShoppingBag, Menu, X } from "lucide-react";
import { useState } from "react";
import { useStore } from "./StoreProvider";
import { useSiteSettings } from "./SiteSettingsProvider";

export default function Header() {
  const pathname = usePathname();
  const { cartCount } = useStore();
  const { settings } = useSiteSettings();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  // Keep admin dashboard dedicated and full-screen without storefront header
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  const links = [
    ["Home", "/"],
    ["Shop", "/shop"],
    ["Categories", "/category/nuts"],
    ["About", "/about"],
    ["Reviews", "/reviews"],
    ["FAQ", "/faq"],
    ["Contact", "/contact"]
  ];

  const siteName = settings.site_name || "PURE ROOTS";
  const tagline = settings.site_tagline || "NATURE'S NUTRITION";
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
        <div className="container nav">
          <button className="iconbtn mobileMenu" onClick={() => setOpen((v) => !v)} aria-label={open ? "Close menu" : "Open menu"}>
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
          <Link href="/" className="logo" onClick={close} aria-label={`${siteName} home`}>
            {settings.logo_image_url ? (
              <img className="logo-img" src={settings.logo_image_url} alt={siteName} />
            ) : (
              <>
                {siteName}
                <small>{tagline}</small>
              </>
            )}
          </Link>
          <nav className="navlinks">
            {links.map(([label, href]) => (
              <Link key={href} href={href}>
                {label}
              </Link>
            ))}
          </nav>
          <div className="actions">
            <Link className="iconbtn action-hide-mobile" href="/search" aria-label="Search">
              <Search size={19} />
            </Link>
            <Link className="iconbtn" href="/account" aria-label="Account">
              <UserRound size={19} />
            </Link>
            <Link className="iconbtn action-hide-mobile" href="/wishlist" aria-label="Wishlist">
              <Heart size={19} />
            </Link>
            <Link className="iconbtn action-hide-mobile" href="/cart" aria-label="Cart">
              <ShoppingBag size={20} />
              {cartCount > 0 && <span className="badge">{cartCount}</span>}
            </Link>
          </div>
        </div>
        {open && (
          <nav className="container mobile-nav" aria-label="Mobile">
            {links.map(([label, href]) => (
              <Link key={href} href={href} onClick={close}>
                {label}
              </Link>
            ))}
            <Link href="/track-order" onClick={close}>
              Track Order
            </Link>
          </nav>
        )}
      </header>
    </>
  );
}
