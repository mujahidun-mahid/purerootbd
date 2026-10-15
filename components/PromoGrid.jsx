import Link from "next/link";
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
    enabled: true,
    order: 3,
  },
];

export function parsePromoBanners(raw) {
  if (!raw) return [...DEFAULT_PROMO_BANNERS];
  try {
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return [...DEFAULT_PROMO_BANNERS];
    return list
      .filter((b) => b && b.enabled !== false && b.title)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .slice(0, 3);
  } catch {
    return [...DEFAULT_PROMO_BANNERS];
  }
}

function LeafMark() {
  return (
    <svg viewBox="0 0 64 64" width="44" height="44" aria-hidden="true">
      <path d="M32 55V31" stroke="#0A400C" strokeWidth="3.5" strokeLinecap="round" fill="none" opacity=".65" />
      <path d="M32 34c0-10 8-18 18-18 0 10-8 18-18 18z" fill="#0A400C" opacity=".8" />
      <path d="M32 43c0-8-6-14-14-14 0 8 6 14 14 14z" fill="#819067" opacity=".8" />
    </svg>
  );
}

function Meadow() {
  return (
    <svg viewBox="0 0 1200 140" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <g opacity=".5">
        <ellipse cx="120" cy="150" rx="180" ry="60" fill="#DDE5D3" />
        <ellipse cx="420" cy="155" rx="220" ry="65" fill="#CFDCC0" />
        <ellipse cx="760" cy="150" rx="200" ry="60" fill="#DDE5D3" />
        <ellipse cx="1060" cy="155" rx="220" ry="65" fill="#E7EBD8" />
      </g>
      <g stroke="#819067" strokeWidth="3" strokeLinecap="round" fill="none" opacity=".55">
        <path d="M80 140 C 78 110, 70 95, 58 82" />
        <path d="M110 140 C 112 108, 120 92, 132 80" />
        <path d="M330 142 C 328 112, 320 96, 308 84" />
        <path d="M560 142 C 562 112, 570 96, 582 84" />
        <path d="M790 142 C 788 112, 780 96, 768 84" />
        <path d="M1010 142 C 1012 112, 1020 98, 1032 86" />
        <path d="M1130 142 C 1128 114, 1122 100, 1112 90" />
      </g>
      <g opacity=".7">
        <g transform="translate(58 74)"><circle r="7" fill="#E8A2B0" /><circle cx="-8" cy="3" r="4" fill="#F3C6CF" /><circle cx="8" cy="4" r="4" fill="#F3C6CF" /><circle r="2.4" fill="#B1AB86" /></g>
        <g transform="translate(132 72)"><circle r="6" fill="#F0D089" /><circle r="2" fill="#946200" /></g>
        <g transform="translate(308 76)"><circle r="7" fill="#C9B8E8" /><circle cx="-8" cy="3" r="4" fill="#DED3F2" /><circle cx="8" cy="4" r="4" fill="#DED3F2" /><circle r="2.4" fill="#6246A5" /></g>
        <g transform="translate(582 76)"><circle r="6" fill="#E8A2B0" /><circle r="2" fill="#B42318" /></g>
        <g transform="translate(768 76)"><circle r="7" fill="#F0D089" /><circle cx="-8" cy="3" r="4" fill="#F7E3B0" /><circle cx="8" cy="4" r="4" fill="#F7E3B0" /><circle r="2.4" fill="#946200" /></g>
        <g transform="translate(1032 78)"><circle r="6" fill="#C9B8E8" /><circle r="2" fill="#6246A5" /></g>
        <g transform="translate(1112 82)"><circle r="6" fill="#E8A2B0" /><circle r="2" fill="#B42318" /></g>
      </g>
    </svg>
  );
}

function ProductCluster() {
  return (
    <svg viewBox="0 0 560 440" role="img" aria-label="Open jar of mixed nuts with honey dipper, spoon and cinnamon sticks">
      <defs>
        <linearGradient id="prGlass" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffffff" stopOpacity=".85" />
          <stop offset=".25" stopColor="#ffffff" stopOpacity=".25" />
          <stop offset=".6" stopColor="#F3EAD2" stopOpacity=".35" />
          <stop offset="1" stopColor="#ffffff" stopOpacity=".7" />
        </linearGradient>
        <linearGradient id="prSilver" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F4F4F6" />
          <stop offset=".5" stopColor="#C9CCD4" />
          <stop offset="1" stopColor="#EDEEF1" />
        </linearGradient>
        <linearGradient id="prWood" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#C99A5B" />
          <stop offset="1" stopColor="#8A5A28" />
        </linearGradient>
        <linearGradient id="prHoney" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F2C14E" />
          <stop offset="1" stopColor="#C99222" />
        </linearGradient>
        <radialGradient id="prGlow" cx=".5" cy=".45" r=".55">
          <stop offset="0" stopColor="#F7E3B0" stopOpacity=".9" />
          <stop offset="1" stopColor="#F7E3B0" stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse cx="280" cy="220" rx="230" ry="170" fill="url(#prGlow)" />
      <ellipse cx="290" cy="382" rx="150" ry="20" fill="#0A400C" opacity=".12" />

      {/* vintage silver spoon */}
      <g transform="rotate(-18 130 330)">
        <rect x="120" y="322" width="150" height="14" rx="7" fill="url(#prSilver)" stroke="#A9AEB8" strokeWidth="1.5" />
        <ellipse cx="105" cy="329" rx="42" ry="30" fill="url(#prSilver)" stroke="#A9AEB8" strokeWidth="1.5" />
        <ellipse cx="105" cy="329" rx="26" ry="17" fill="#D9DBE0" />
        <ellipse cx="97" cy="324" rx="10" ry="6" fill="#fff" opacity=".8" />
        <circle cx="150" cy="322" r="4" fill="#B1AB86" />
      </g>
      {/* honey pool by the spoon */}
      <ellipse cx="92" cy="368" rx="34" ry="9" fill="url(#prHoney)" opacity=".9" />
      <path d="M92 376 c 2 8 -2 12 0 20" stroke="#C99222" strokeWidth="4" strokeLinecap="round" fill="none" />

      {/* open glass jar of mixed nuts */}
      <g>
        <rect x="212" y="150" width="196" height="216" rx="30" fill="url(#prGlass)" stroke="#D8CFB8" strokeWidth="2.5" />
        {/* nuts fill */}
        <g>
          <ellipse cx="252" cy="330" rx="20" ry="14" fill="#B07A3F" />
          <ellipse cx="290" cy="338" rx="22" ry="13" fill="#ECD9A8" stroke="#C9A95F" strokeWidth="1.5" />
          <ellipse cx="330" cy="332" rx="20" ry="14" fill="#8A5F33" />
          <ellipse cx="368" cy="338" rx="18" ry="12" fill="#B07A3F" />
          <ellipse cx="268" cy="306" rx="21" ry="13" fill="#8A5F33" />
          <ellipse cx="308" cy="310" rx="22" ry="13" fill="#B07A3F" />
          <ellipse cx="348" cy="306" rx="20" ry="13" fill="#A9B17C" stroke="#7C8A54" strokeWidth="1.5" />
          <ellipse cx="250" cy="282" rx="20" ry="12" fill="#ECD9A8" stroke="#C9A95F" strokeWidth="1.5" />
          <ellipse cx="288" cy="286" rx="21" ry="12" fill="#B07A3F" />
          <ellipse cx="328" cy="282" rx="20" ry="12" fill="#8A5F33" />
          <ellipse cx="366" cy="286" rx="18" ry="11" fill="#ECD9A8" stroke="#C9A95F" strokeWidth="1.5" />
          <ellipse cx="270" cy="260" rx="20" ry="12" fill="#A9B17C" stroke="#7C8A54" strokeWidth="1.5" />
          <ellipse cx="310" cy="262" rx="21" ry="12" fill="#ECD9A8" stroke="#C9A95F" strokeWidth="1.5" />
          <ellipse cx="350" cy="260" rx="19" ry="11" fill="#B07A3F" />
          <ellipse cx="290" cy="240" rx="20" ry="11" fill="#8A5F33" />
          <ellipse cx="330" cy="240" rx="20" ry="11" fill="#B07A3F" />
          <ellipse cx="310" cy="222" rx="18" ry="10" fill="#ECD9A8" stroke="#C9A95F" strokeWidth="1.5" />
        </g>
        {/* nut highlights */}
        <g stroke="#fff" strokeWidth="2" opacity=".5" strokeLinecap="round">
          <path d="M244 326 l10 -4" /><path d="M300 306 l10 -4" /><path d="M322 278 l10 -4" />
        </g>
        {/* glass shine */}
        <rect x="224" y="168" width="20" height="170" rx="10" fill="#fff" opacity=".55" />
        <rect x="384" y="180" width="8" height="140" rx="4" fill="#fff" opacity=".4" />
        {/* rim + wooden lid resting beside */}
        <rect x="206" y="138" width="208" height="22" rx="11" fill="#EFE6D2" stroke="#D8CFB8" strokeWidth="2" />
        <g transform="rotate(12 470 330)">
          <rect x="428" y="312" width="88" height="26" rx="13" fill="url(#prWood)" stroke="#6E421D" strokeWidth="2" />
          <line x1="442" y1="314" x2="442" y2="336" stroke="#6E421D" strokeWidth="2" opacity=".6" />
          <line x1="458" y1="314" x2="458" y2="336" stroke="#6E421D" strokeWidth="2" opacity=".6" />
        </g>
        {/* label */}
        <g>
          <rect x="252" y="300" width="116" height="48" rx="10" fill="#FEFAE0" stroke="#B1AB86" strokeWidth="1.5" />
          <text x="310" y="320" textAnchor="middle" fontSize="13" fontWeight="800" fill="#0A400C" fontFamily="Georgia,serif">PURE ROOTS</text>
          <text x="310" y="336" textAnchor="middle" fontSize="9" letterSpacing="2" fill="#819067">MIXED NUTS</text>
        </g>
      </g>

      {/* honey dipper leaning on jar */}
      <g transform="rotate(24 440 200)">
        <rect x="434" y="80" width="12" height="130" rx="6" fill="url(#prWood)" stroke="#6E421D" strokeWidth="1.5" />
        <g fill="url(#prWood)" stroke="#6E421D" strokeWidth="1.5">
          <ellipse cx="440" cy="218" rx="20" ry="7" />
          <ellipse cx="440" cy="228" rx="23" ry="7" />
          <ellipse cx="440" cy="238" rx="23" ry="7" />
          <ellipse cx="440" cy="248" rx="20" ry="7" />
        </g>
        <path d="M440 258 c 3 10 -3 14 1 24 c 2 7 -2 12 0 18" stroke="url(#prHoney)" strokeWidth="6" strokeLinecap="round" fill="none" />
      </g>

      {/* cinnamon bundle tied with twine */}
      <g transform="rotate(-14 170 330)">
        <rect x="96" y="296" width="150" height="20" rx="10" fill="#A9703F" stroke="#724523" strokeWidth="2" />
        <rect x="96" y="318" width="150" height="20" rx="10" fill="#8F5A2E" stroke="#5E3A1B" strokeWidth="2" />
        <rect x="96" y="340" width="150" height="20" rx="10" fill="#A9703F" stroke="#724523" strokeWidth="2" />
        <ellipse cx="98" cy="306" rx="6" ry="10" fill="#5E3A1B" />
        <ellipse cx="98" cy="328" rx="6" ry="10" fill="#4A2C14" />
        <ellipse cx="98" cy="350" rx="6" ry="10" fill="#5E3A1B" />
        <path d="M170 292 c -6 14 -6 60 0 76" stroke="#E7D9BE" strokeWidth="5" fill="none" />
        <path d="M170 292 c -6 14 -6 60 0 76" stroke="#B1AB86" strokeWidth="1.5" fill="none" strokeDasharray="4 3" />
        <g fill="none" stroke="#E7D9BE" strokeWidth="4" strokeLinecap="round">
          <path d="M170 330 c -14 -4 -20 -16 -16 -28 c 8 4 14 14 16 28" />
          <path d="M170 330 c 14 -4 20 -16 16 -28 c -8 4 -14 14 -16 28" />
        </g>
      </g>

      {/* scattered almonds */}
      <g fill="#B07A3F" stroke="#8A5A28" strokeWidth="1.5">
        <ellipse cx="60" cy="300" rx="13" ry="8" transform="rotate(-24 60 300)" />
        <ellipse cx="500" cy="360" rx="13" ry="8" transform="rotate(20 500 360)" />
        <ellipse cx="470" cy="120" rx="12" ry="7" transform="rotate(-30 470 120)" />
        <ellipse cx="120" cy="200" rx="12" ry="7" transform="rotate(28 120 200)" />
        <ellipse cx="180" cy="392" rx="13" ry="8" transform="rotate(12 180 392)" />
        <ellipse cx="420" cy="392" rx="13" ry="8" transform="rotate(-14 420 392)" />
      </g>
    </svg>
  );
}

export default function PromoGrid({ hero }) {
  return (
    <section className="section pr-hero-section" aria-label="Nature's nutrition delivered pure">
      <div className="container">
        <div className="pr-hero">
          <div className="pr-hero-glow" aria-hidden="true" />
          <div className="pr-hero-mark" aria-hidden="true">
            <LeafMark />
          </div>
          <div className="pr-hero-inner">
            <div className="pr-hero-art">
              <ProductCluster />
            </div>
            <div className="pr-hero-copy">
              {hero.eyebrow && <div className="kicker">{hero.eyebrow}</div>}
              <h1 className="serif">{hero.title}</h1>
              {hero.subtitle && <p>{hero.subtitle}</p>}
              {hero.offer && <div className="promo-offer">{hero.offer}</div>}
              <div className="hero-actions">
                {hero.cta_link && (
                  <Link className="btn btn-primary" href={safeHref(hero.cta_link)}>
                    {hero.cta_text || "Shop Now"}
                  </Link>
                )}
                {hero.secondary_link && (
                  <Link className="btn btn-outline" href={safeHref(hero.secondary_link)}>
                    {hero.secondary_text || "Learn More"}
                  </Link>
                )}
              </div>
            </div>
          </div>
          <div className="pr-hero-meadow" aria-hidden="true">
            <Meadow />
          </div>
          <div className="pr-hero-foot">Featured Categories</div>
        </div>
      </div>
    </section>
  );
}
