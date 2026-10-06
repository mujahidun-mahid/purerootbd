import "./globals.css"; import Header from "@/components/Header"; import Footer from "@/components/Footer"; import {StoreProvider} from "@/components/StoreProvider"; import AnalyticsTracker from "@/components/AnalyticsTracker";
export const metadata={title:"Pure Roots | Premium Nutrition & Natural Foods",description:"Premium nuts, seeds, spices, natural honey and nutrition-focused foods in Bangladesh."};
export default function RootLayout({children}){return <html lang="en"><body><StoreProvider><AnalyticsTracker/><Header/><main>{children}</main><Footer/></StoreProvider></body></html>}
