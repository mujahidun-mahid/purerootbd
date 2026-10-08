import "./globals.css"; import Header from "@/components/Header"; import Footer from "@/components/Footer"; import BottomNav from "@/components/BottomNav"; import {StoreProvider} from "@/components/StoreProvider"; import AnalyticsTracker from "@/components/AnalyticsTracker"; import SiteSettingsProvider from "@/components/SiteSettingsProvider";
import { getSiteSettings } from "@/lib/site-settings";
import { SITE_URL } from "@/lib/site-defaults";

export async function generateMetadata() {
  const s = await getSiteSettings();
  const title = s.meta_title || `${s.site_name} | Premium Nutrition & Natural Foods`;
  const description = s.meta_description || s.site_description;

  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: `%s | ${s.site_name || "Pure Roots"}` },
    description,
    applicationName: s.site_name || "Pure Roots",
    keywords: ["Pure Roots","buy nuts online Bangladesh","almonds","cashew nuts","walnuts","chia seeds","pumpkin seeds","natural honey","organic spices","dry fruits Dhaka","premium nutrition","healthy snacks"],
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      locale: "en_US",
      url: SITE_URL,
      siteName: s.site_name || "Pure Roots",
      title,
      description,
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/opengraph-image"],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
    },
  };
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({children}){return <html lang="en"><body><StoreProvider><SiteSettingsProvider><AnalyticsTracker/><Header/><main>{children}</main><Footer/><BottomNav/></SiteSettingsProvider></StoreProvider></body></html>}
