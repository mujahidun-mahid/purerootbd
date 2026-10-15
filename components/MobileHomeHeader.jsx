"use client";
import Link from "next/link";
import { Search, UserRound } from "lucide-react";
import { useSiteSettings } from "./SiteSettingsProvider";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function MobileHomeHeader() {
  const { settings } = useSiteSettings();
  const siteName = settings.site_name || "PURE ROOTS";

  return (
    <section className="m-home-head" aria-label="Welcome">
      <div className="container m-home-head-inner">
        <div className="m-home-greet">
          <span className="m-home-eyebrow">{greeting()} 👋</span>
          <h1 className="m-home-title">{siteName}</h1>
        </div>
        <Link href="/account" className="m-home-avatar" aria-label="Account">
          <UserRound size={20} />
        </Link>
      </div>
      <div className="container">
        <Link href="/search" className="m-home-search" aria-label="Search products">
          <Search size={18} aria-hidden="true" />
          <span>Search nuts, honey, seeds…</span>
        </Link>
      </div>
    </section>
  );
}
