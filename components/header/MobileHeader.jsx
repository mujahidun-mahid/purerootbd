"use client";
import Link from "next/link";
import { Bell, ShoppingBag, Search, SlidersHorizontal, Menu, X } from "lucide-react";
import { useState } from "react";
import { useStore } from "../StoreProvider";
import { useSiteSettings } from "../SiteSettingsProvider";
import { SUB_NAV_LINKS } from "./DesktopHeader";

const QUICK_PILLS = ["Fruits", "Dairy", "Vegetable", "Meat", "Drink", "Snacks", "Bakery"];

export default function MobileHeader() {
  const { cartCount } = useStore();
  const { settings } = useSiteSettings();
  const [open, setOpen] = useState(false);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";
  const userName = "Guest";

  return (
    <div className="mobile-header" role="navigation" aria-label="Mobile navigation">
      <div className="container mobile-header-top">
        <div className="mobile-user">
          <span className="mobile-avatar" aria-hidden="true">G</span>
          <span className="mobile-greeting">
            <small>{greeting},</small>
            <strong>{settings.site_name ? userName : userName}</strong>
          </span>
        </div>
        <div className="mobile-header-actions">
          <Link href="/account" className="iconbtn" aria-label="Notifications"><Bell size={20} /></Link>
          <Link href="/cart" className="iconbtn" aria-label="Cart">
            <ShoppingBag size={20} />
            {cartCount > 0 && <span className="badge">{cartCount}</span>}
          </Link>
          <button className="iconbtn" onClick={() => setOpen((v) => !v)} aria-label={open ? "Close menu" : "Open menu"}>
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      <div className="container mobile-search-row" role="search">
        <div className="mobile-search-bar">
          <Search size={18} aria-hidden="true" />
          <input type="search" placeholder="Search groceries..." aria-label="Search groceries" />
        </div>
        <button className="mobile-filter-btn" aria-label="Filter categories"><SlidersHorizontal size={18} /></button>
      </div>
      <div className="mobile-pills" role="tablist" aria-label="Quick categories">
        {QUICK_PILLS.map((pill) => (
          <Link key={pill} href={`/shop`} className="mobile-pill" role="tab">{pill}</Link>
        ))}
      </div>
      {open && (
        <nav className="container mobile-nav" aria-label="Mobile menu">
          {SUB_NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>{link.label}</Link>
          ))}
          <Link href="/track-order" onClick={() => setOpen(false)}>Track Order</Link>
        </nav>
      )}
    </div>
  );
}
