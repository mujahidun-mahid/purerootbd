import "./globals.css"; import Header from "@/components/Header"; import Footer from "@/components/Footer"; import {StoreProvider} from "@/components/StoreProvider"; import AnalyticsTracker from "@/components/AnalyticsTracker";

const SITE_URL = "https://pure-roots-fawn.vercel.app";
const SITE_NAME = "Pure Roots";
const TITLE = "Pure Roots | Premium Nutrition & Natural Foods";
const DESCRIPTION = "Premium nuts, seeds, spices, natural honey and nutrition-focused foods in Bangladesh. Freshly packed, Cash on Delivery available nationwide.";

export const metadata={
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE, template: "%s | Pure Roots" },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: ["Pure Roots","buy nuts online Bangladesh","almonds","cashew nuts","walnuts","chia seeds","pumpkin seeds","natural honey","organic spices","dry fruits Dhaka","premium nutrition","healthy snacks"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
};

export default function RootLayout({children}){return <html lang="en"><body><StoreProvider><AnalyticsTracker/><Header/><main>{children}</main><Footer/></StoreProvider></body></html>}
