"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Phone, Mail, MapPin } from "lucide-react";
import { useSiteSettings } from "./SiteSettingsProvider";

export default function Footer() {
  const pathname = usePathname();
  const { settings } = useSiteSettings();

  // Hide storefront footer on admin dashboard
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  const siteName = settings.site_name || "PURE ROOTS";
  const tagline = settings.site_tagline || "NATURE'S NUTRITION";
  const contacts = [
    ["phone", settings.contact_phone, `tel:${settings.contact_phone}`],
    ["email", settings.contact_email, `mailto:${settings.contact_email}`],
    ["address", settings.contact_address, ""]
  ].filter(([, v]) => String(v || "").trim() !== "");

  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <div className="logo" style={{ color: "#fff" }}>
            {settings.logo_image_url ? (
              <img className="logo-img" src={settings.logo_image_url} alt={siteName} />
            ) : (
              <>
                {siteName}
                <small style={{ color: "#C8A45D" }}>{tagline}</small>
              </>
            )}
          </div>
          <p style={{ color: "#b9c9bd", fontSize: 13, lineHeight: 1.7 }}>
            {settings.site_description ||
              "Premium nuts, seeds, spices, natural honey and nutrition-focused foods, carefully selected for everyday wellness."}
          </p>
          {contacts.length > 0 && (
            <div className="footer-contact">
              {contacts.map(([kind, value, href]) =>
                href ? (
                  <a key={kind} href={href}>
                    {kind === "phone" ? <Phone size={13} /> : <Mail size={13} />} {value}
                  </a>
                ) : (
                  <span key={kind}>
                    <MapPin size={13} /> {value}
                  </span>
                )
              )}
            </div>
          )}
        </div>
        <div>
          <h3>Shop</h3>
          <Link href="/shop">All Products</Link>
          <Link href="/category/nuts">Nuts</Link>
          <Link href="/category/seeds">Seeds</Link>
          <Link href="/category/honey">Honey</Link>
        </div>
        <div>
          <h3>Categories</h3>
          <Link href="/category/spices">Spices</Link>
          <Link href="/category/nut-mixes">Nut Mixes</Link>
          <Link href="/category/seed-mixes">Seed Mixes</Link>
          <Link href="/category/superfoods">Superfoods</Link>
        </div>
        <div>
          <h3>Support</h3>
          <Link href="/faq">FAQ</Link>
          <Link href="/track-order">Track Order</Link>
          <Link href="/shipping">Shipping</Link>
          <Link href="/returns">Returns</Link>
        </div>
        <div>
          <h3>Company</h3>
          <Link href="/about">About</Link>
          <Link href="/reviews">Reviews</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </div>
      </div>
      <div className="container copyright">
        {settings.footer_text ||
          "© Pure Roots. All rights reserved. · BDT (৳) · bKash · Nagad · Cash on Delivery · Bank Transfer"}
      </div>
    </footer>
  );
}
