"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Phone, Mail, MapPin, Plus } from "lucide-react";
import { useSiteSettings } from "./SiteSettingsProvider";

const GROUPS = [
  {
    id: "explore",
    label: "Explore",
    links: [
      ["Home", "/"],
      ["Shop", "/shop"],
      ["Categories", "/shop"],
      ["About Us", "/about"],
    ],
  },
  {
    id: "care",
    label: "Customer Care",
    links: [
      ["Contact", "/contact"],
      ["FAQ", "/faq"],
      ["Reviews", "/reviews"],
      ["Track Order", "/track-order"],
    ],
  },
  {
    id: "policies",
    label: "Policies",
    links: [
      ["Privacy Policy", "/privacy"],
      ["Terms & Conditions", "/terms"],
      ["Shipping", "/shipping"],
      ["Returns", "/returns"],
    ],
  },
];

export default function Footer() {
  const pathname = usePathname();
  const { settings } = useSiteSettings();
  const [open, setOpen] = useState(null);

  // Hide storefront footer on admin dashboard
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  const siteName = settings.site_name || "PURE ROOTS";
  const tagline = settings.site_tagline || "NATURE'S NUTRITION";
  const contacts = [
    ["phone", settings.contact_phone, `tel:${settings.contact_phone}`, Phone],
    ["email", settings.contact_email, `mailto:${settings.contact_email}`, Mail],
    ["address", settings.contact_address, "", MapPin],
  ].filter(([, v]) => String(v || "").trim() !== "");

  return (
    <footer className="footer">
      <div className="container footer-top">
        <div className="footer-brand">
          <Link href="/" className="footer-logo" aria-label={`${siteName} home`}>
            {settings.logo_image_url ? (
              <img className="logo-img" src={settings.logo_image_url} alt={siteName} />
            ) : (
              <span className="footer-wordmark">{siteName}</span>
            )}
          </Link>
          <p className="footer-tag">Fresh choices, naturally better.</p>
          {contacts.length > 0 && (
            <address className="footer-contact">
              {contacts.map(([kind, value, href, Icon]) =>
                href ? (
                  <a key={kind} href={href}>
                    <Icon size={14} aria-hidden="true" /> {value}
                  </a>
                ) : (
                  <span key={kind}>
                    <Icon size={14} aria-hidden="true" /> {value}
                  </span>
                )
              )}
            </address>
          )}
        </div>

        <nav className="footer-groups" aria-label="Footer">
          {GROUPS.map((g) => {
            const expanded = open === g.id;
            return (
              <div className="f-group" key={g.id}>
                <button
                  type="button"
                  className="f-toggle"
                  aria-expanded={expanded}
                  aria-controls={`f-panel-${g.id}`}
                  onClick={() => setOpen(expanded ? null : g.id)}
                >
                  {g.label}
                  <Plus size={16} aria-hidden="true" className={expanded ? "open" : ""} />
                </button>
                <div className={`f-links${expanded ? " open" : ""}`} id={`f-panel-${g.id}`}>
                  {g.links.map(([label, href]) => (
                    <Link key={href + label} href={href}>
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>
      </div>
      <div className="container footer-bottom">
        <small>
          {settings.footer_text || "© 2026 Pure Roots. All rights reserved."}
        </small>
      </div>
    </footer>
  );
}
