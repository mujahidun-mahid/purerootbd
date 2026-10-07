"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, UserRound, Heart, ShoppingBag, Menu, X } from "lucide-react";
import { useState } from "react";
import { useStore } from "./StoreProvider";

export default function Header() {
  const pathname = usePathname();
  const { cartCount } = useStore();
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

  return (
    <header className="header">
      <div className="container nav">
        <button className="iconbtn mobileMenu" onClick={() => setOpen((v) => !v)} aria-label={open ? "Close menu" : "Open menu"}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
        <Link href="/" className="logo" onClick={close}>
          PURE ROOTS<small>NATURE'S NUTRITION</small>
        </Link>
        <nav className="navlinks">
          {links.map(([label, href]) => (
            <Link key={href} href={href}>
              {label}
            </Link>
          ))}
        </nav>
        <div className="actions">
          <Link className="iconbtn" href="/search" aria-label="Search">
            <Search size={19} />
          </Link>
          <Link className="iconbtn" href="/account" aria-label="Account">
            <UserRound size={19} />
          </Link>
          <Link className="iconbtn" href="/wishlist" aria-label="Wishlist">
            <Heart size={19} />
          </Link>
          <Link className="iconbtn" href="/cart" aria-label="Cart">
            <ShoppingBag size={20} />
            {cartCount > 0 && <span className="badge">{cartCount}</span>}
          </Link>
        </div>
      </div>
      {open && (
        <div className="mobile-nav">
          {links.map(([label, href]) => (
            <Link key={href} href={href} onClick={close}>
              {label}
            </Link>
          ))}
          <Link href="/track-order" onClick={close}>
            Track Order
          </Link>
        </div>
      )}
    </header>
  );
}
