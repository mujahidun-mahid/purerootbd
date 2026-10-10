"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSiteSettings } from "./SiteSettingsProvider";

const LINKS = [
  ["Home", "/"],
  ["Shop", "/shop"],
  ["About", "/about"],
  ["FAQ", "/faq"],
  ["Contact", "/contact"],
  ["Privacy", "/privacy"],
  ["Terms", "/terms"],
];

export default function Footer() {
  const pathname = usePathname();
  const { settings } = useSiteSettings();

  // Hide storefront footer on admin dashboard
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  const siteName = settings.site_name || "PURE ROOTS";
  const phone = String(settings.contact_phone || "").trim();
  const email = String(settings.contact_email || "").trim();

  return (
    <footer className="footer">
      <div className="container footer-min">
        <Link href="/" className="footer-logo" aria-label={`${siteName} home`}>
          {settings.logo_image_url ? (
            <img className="logo-img" src={settings.logo_image_url} alt={siteName} />
          ) : (
            <span className="footer-wordmark">{siteName}</span>
          )}
        </Link>
        <nav className="footer-links" aria-label="Footer">
          {LINKS.map(([label, href]) => (
            <Link key={href + label} href={href}>
              {label}
            </Link>
          ))}
        </nav>
        {(phone || email) && (
          <p className="footer-meta">
            {phone && <a href={`tel:${phone}`}>{phone}</a>}
            {phone && email && <span aria-hidden="true"> · </span>}
            {email && <a href={`mailto:${email}`}>{email}</a>}
          </p>
        )}
        <small className="footer-copy">
          {settings.footer_text || "© 2026 Pure Roots. All rights reserved."}
        </small>
      </div>
    </footer>
  );
}
