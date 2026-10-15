import { safeHref } from "@/lib/safeUrl";

export const DEFAULT_PROMO_BANNERS = [
  {
    id: "promo-new",
    slot: "secondary1",
    eyebrow: "Just Landed",
    title: "New Arrivals",
    description: "Fresh picks added to the shelves this week.",
    image: "",
    cta_text: "Explore",
    cta_link: "/shop",
    bg: "",
    badge: "",
    enabled: true,
    order: 1,
  },
  {
    id: "promo-deals",
    slot: "secondary2",
    eyebrow: "While Stock Lasts",
    title: "Limited-Time Offers",
    description: "Special prices on customer favourites.",
    image: "",
    cta_text: "Grab Deals",
    cta_link: "/shop",
    bg: "",
    badge: "",
    enabled: true,
    order: 2,
  },
  {
    id: "promo-collections",
    slot: "secondary3",
    eyebrow: "Curated For You",
    title: "Featured Collections",
    description: "Bundles for everyday wellness routines.",
    image: "",
    cta_text: "View More",
    cta_link: "/shop",
    bg: "",
    badge: "",
    enabled: true,
    order: 3,
  },
];

const str = (v, max = 160) => String(v ?? "").slice(0, max);

export function parseHeroBanners(raw) {
  let list = [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) list = parsed;
  } catch {
    list = [];
  }
  return list
    .filter((b) => b && typeof b === "object")
    .map((b, i) => ({
      id: b.id ?? `promo-${i + 1}`,
      eyebrow: str(b.eyebrow, 60),
      title: str(b.title, 80),
      description: str(b.description, 200),
      image: str(b.image, 2000),
      cta_text: str(b.cta_text, 40) || "Shop Now",
      cta_link: safeHref(b.cta_link, "/shop"),
      bg: str(b.bg, 120),
      badge: str(b.badge, 24),
      enabled: b.enabled !== false,
      order: Number.isFinite(+b.order) ? +b.order : i + 1,
    }))
    .filter((b) => b.title)
    .sort((a, b) => a.order - b.order)
    .slice(0, 3);
}

export function toHeroOfferCard(banner, index = 0) {
  return {
    id: banner.id ?? index + 1,
    tagline: banner.eyebrow || "",
    title: banner.title || "",
    subtitle: banner.description || "",
    linkText: banner.cta_text || "Shop Now",
    linkUrl: banner.cta_link || "/shop",
    badgeText: banner.badge || "",
    imageUrl: banner.image || "",
    isActive: banner.enabled !== false,
    positionOrder: banner.order ?? index + 1,
  };
}
