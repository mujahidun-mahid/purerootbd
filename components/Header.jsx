"use client";
import { usePathname } from "next/navigation";
import { useSiteSettings } from "./SiteSettingsProvider";
import DesktopHeader from "./header/DesktopHeader";
import MobileHeader from "./header/MobileHeader";

export default function Header() {
  const pathname = usePathname();
  const { settings } = useSiteSettings();

  if (pathname?.startsWith("/admin")) {
    return null;
  }

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
        <DesktopHeader pathname={pathname} />
        <MobileHeader />
      </header>
    </>
  );
}
