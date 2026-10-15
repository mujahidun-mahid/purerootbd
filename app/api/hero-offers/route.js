import { NextResponse } from "next/server";
import { getSiteSettings } from "@/lib/site-settings";
import { DEFAULT_PROMO_BANNERS, parseHeroBanners, toHeroOfferCard } from "@/lib/hero-offers";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("active") !== "0";
    const settings = await getSiteSettings();
    const stored = parseHeroBanners(settings.promo_banners).map(toHeroOfferCard);
    const source = stored.length ? stored : DEFAULT_PROMO_BANNERS.map(toHeroOfferCard);
    const offers = activeOnly ? source.filter((o) => o.isActive) : source;
    return NextResponse.json(
      { offers },
      { headers: { "cache-control": "no-store" } }
    );
  } catch (e) {
    console.error("GET /api/hero-offers failed:", e);
    return NextResponse.json({ error: "Could not load hero offers" }, { status: 500 });
  }
}
