import Link from "next/link";
import Image from "next/image";
import { money } from "@/lib/products";
import ProductGrid from "./ProductGrid";

export const SECTION_TYPES = [
  { type: "hero", label: "Hero Banner", icon: "🖼️", description: "Full-width banner with title, subtitle, image, and CTA" },
  { type: "richtext", label: "Rich Text", icon: "📝", description: "Markdown/HTML content block" },
  { type: "image_text", label: "Image + Text", icon: "📐", description: "Side-by-side image and text layout" },
  { type: "products", label: "Product Grid", icon: "🛍️", description: "Display selected products or category" },
  { type: "categories", label: "Category Grid", icon: "🗂️", description: "Display featured categories" },
  { type: "faq", label: "FAQ Section", icon: "❓", description: "Collapsible FAQ accordion" },
  { type: "reviews", label: "Reviews", icon: "⭐", description: "Customer reviews/testimonials" },
  { type: "image_gallery", label: "Image Gallery", icon: "🖼️", description: "Grid of images with captions" },
  { type: "video", label: "Video", icon: "🎬", description: "Embedded video player" },
  { type: "cta_banner", label: "CTA Banner", icon: "🎯", description: "Call-to-action banner with button" },
  { type: "divider", label: "Divider", icon: "➖", description: "Horizontal divider with optional label" },
  { type: "spacer", label: "Spacer", icon: "⬜", description: "Vertical spacing" },
];

export const SECTION_TYPES_MAP = Object.fromEntries(SECTION_TYPES.map(t => [t.type, t]));

export function getDefaultSectionData(type) {
  switch (type) {
    case "hero":
      return { title: "", subtitle: "", image: "", cta_text: "", cta_link: "", alignment: "center", height: "medium" };
    case "richtext":
      return { content: "" };
    case "image_text":
      return { image: "", title: "", content: "", image_position: "left", alignment: "left" };
    case "products":
      return { source: "featured", category: "", product_ids: [], limit: 8, title: "Featured Products", show_view_all: true, view_all_link: "/shop" };
    case "categories":
      return { category_ids: [], title: "Shop by Category", show_all_link: true, all_link: "/shop" };
    case "faq":
      return { items: [{ question: "", answer: "" }], title: "Frequently Asked Questions" };
    case "reviews":
      return { items: [{ author: "", rating: 5, text: "", date: "" }], title: "Customer Reviews" };
    case "image_gallery":
      return { images: [{ url: "", caption: "", alt: "" }], columns: 3, title: "" };
    case "video":
      return { url: "", title: "", description: "", aspect_ratio: "16:9" };
    case "cta_banner":
      return { title: "", description: "", button_text: "", button_link: "", background: "", text_color: "white", alignment: "center" };
    case "divider":
      return { label: "", style: "line" };
    case "spacer":
      return { height: "medium" };
    default:
      return {};
  }
}

// ============================================
// Section Renderers - Accept data as props, no data fetching
// ============================================

export function HeroSection({ data }) {
  const { title, subtitle, image, cta_text, cta_link, alignment = "center", height = "medium" } = data;
  const heights = { small: "py-12 md:py-16", medium: "py-16 md:py-24", large: "py-20 md:py-32" };
  const alignments = { left: "text-left items-start", center: "text-center items-center", right: "text-right items-end" };

  return (
    <section className={`relative overflow-hidden ${heights[height] || heights.medium} ${alignments[alignment] || alignments.center}`}>
      {image && (
        <div className="absolute inset-0 -z-10">
          <Image src={image} alt="" fill className="object-cover" priority />
          <div className="absolute inset-0 bg-black/30" />
        </div>
      )}
      <div className="container relative flex flex-col justify-center min-h-[300px]">
        {data.title && <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">{data.title}</h1>}
        {data.subtitle && <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl">{data.subtitle}</p>}
        {data.cta_text && data.cta_link && (
          <Link href={data.cta_link} className="inline-flex items-center gap-2 bg-white text-green-800 px-6 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors">
            {data.cta_text}
          </Link>
        )}
      </div>
    </section>
  );
}

export function RichTextSection({ data }) {
  const { content } = data;
  if (!content) return null;
  return (
    <section className="section container">
      <div className="prose prose-green max-w-none" dangerouslySetInnerHTML={{ __html: content }} />
    </section>
  );
}

export function ImageTextSection({ data }) {
  const { image, title, content, image_position = "left", alignment = "left" } = data;
  if (!image && !title && !content) return null;
  const alignments = { left: "text-left", center: "text-center", right: "text-right" };
  const imageFirst = image_position === "left";

  return (
    <section className="section container">
      <div className={`split ${alignments[alignment] || "text-left"}`}>
        <div className={imageFirst ? "" : "order-2"}>
          {image && (
            <div className="hero-art" style={{ minHeight: 300 }}>
              <Image src={image} alt={data.alt || ""} fill className="object-cover" />
            </div>
          )}
        </div>
        <div className={!imageFirst ? "" : "order-2"}>
          {data.title && <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">{data.title}</h2>}
          {data.content && <div className="prose prose-gray max-w-none" dangerouslySetInnerHTML={{ __html: data.content }} />}
        </div>
      </div>
    </section>
  );
}

// ProductsSection - accepts products as prop, filters based on config
export function ProductsSection({ data, products = [] }) {
  const { source = "featured", category, product_ids = [], limit = 8, title, show_view_all = true, view_all_link = "/shop" } = data;

  let filteredProducts = [...products];

  if (source === "category" && category) {
    filteredProducts = filteredProducts.filter(p => p.category === category);
  } else if (source === "manual" && Array.isArray(product_ids) && product_ids.length > 0) {
    const ids = product_ids.map(id => id.trim()).filter(Boolean);
    filteredProducts = filteredProducts.filter(p => ids.includes(p.id));
  } else if (source === "featured") {
    // Featured products are typically the first N products or those with high ratings
    filteredProducts = filteredProducts.filter(p => p.rating >= 4).slice(0, limit || 8);
  }

  if (limit && limit > 0) {
    filteredProducts = filteredProducts.slice(0, limit);
  }

  if (!filteredProducts.length && !title) return null;

  return (
    <section className="section">
      <div className="container">
        {(title || show_view_all) && (
          <div className="toolbar">
            <div>
              {title && <h2 className="text-2xl font-bold text-gray-900">{title}</h2>}
            </div>
            {show_view_all && view_all_link && (
              <Link href={view_all_link} className="btn btn-outline">View All</Link>
            )}
          </div>
        )}
        <ProductGrid products={filteredProducts} />
        {!filteredProducts.length && (
          <div className="empty">
            <p className="muted">No products found for this section.</p>
          </div>
        )}
      </div>
    </section>
  );
}

// CategoriesSection - accepts categories as prop, filters based on config
export function CategoriesSection({ data, categories = [] }) {
  const { category_ids = [], title, show_all_link = true, all_link = "/shop" } = data;

  let filteredCategories = [...categories];

  if (Array.isArray(category_ids) && category_ids.length > 0) {
    const ids = category_ids.map(id => id.trim()).filter(Boolean);
    filteredCategories = filteredCategories.filter(c => ids.includes(c.slug));
  }

  if (!filteredCategories.length && !title) return null;

  return (
    <section className="section">
      <div className="container">
        {(title || show_all_link) && (
          <div className="toolbar">
            <div>
              {title && <h2 className="text-2xl font-bold text-gray-900">{title}</h2>}
            </div>
            {show_all_link && all_link && (
              <Link href={all_link} className="btn btn-outline">View All</Link>
            )}
          </div>
        )}
        <div className="cat-grid">
          {filteredCategories.map(c => (
            <Link key={c.slug} href={`/category/${c.slug}`} className="cat">
              <div className="cat-art">
                {c.image ? <Image src={c.image} alt="" fill className="object-cover" /> : <span className="cat-icon">{c.icon || "📦"}</span>}
              </div>
              <div>
                <strong>{c.name}</strong>
                <small className="muted">{c.description}</small>
              </div>
            </Link>
          ))}
        </div>
        {!filteredCategories.length && <div className="empty"><p className="muted">No categories to display.</p></div>}
        {show_all_link && all_link && (
          <div style={{ textAlign: "center", marginTop: 20 }}>
            <Link href={all_link} className="btn btn-outline">View All Categories</Link>
          </div>
        )}
      </div>
    </section>
  );
}

export function FAQSection({ data }) {
  const { items = [], title } = data;
  const validItems = items.filter(item => item.question && item.answer);
  if (!validItems.length && !title) return null;

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 900 }}>
        {title && <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">{title}</h2>}
        <div className="space-y-4">
          {validItems.map((item, i) => (
            <details key={i} className="faq group">
              <summary className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg cursor-pointer list-none">
                <span className="font-medium text-gray-900">{item.question}</span>
                <svg className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </summary>
              <div className="p-4 text-gray-600 border border-t-0 border-gray-200 rounded-b-lg bg-gray-50">
                {item.answer}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ReviewsSection({ data }) {
  const { items = [], title } = data;
  const validItems = items.filter(item => item.text);
  if (!validItems.length && !title) return null;

  return (
    <section className="section">
      <div className="container">
        {title && <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">{title}</h2>}
        <div className="grid product-grid">
          {validItems.map((item, i) => (
            <div key={i} className="card card-body">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-yellow-500">{"★".repeat(item.rating || 5)}</span>
                <span className="text-sm text-gray-500">{item.author}</span>
                {item.date && <span className="text-sm text-gray-400 ml-auto">{item.date}</span>}
              </div>
              <p className="text-gray-700">"{item.text}"</p>
            </div>
          ))}
        </div>
        {!validItems.length && <div className="empty"><p className="muted">No reviews to display.</p></div>}
      </div>
    </section>
  );
}

export function ImageGallerySection({ data }) {
  const { images = [], columns = 3, title } = data;
  const validImages = images.filter(img => img.url);
  if (!validImages.length && !title) return null;

  const colClasses = { 2: "md:grid-cols-2", 3: "md:grid-cols-3 lg:grid-cols-4", 4: "md:grid-cols-4 lg:grid-cols-5" };

  return (
    <section className="section">
      <div className="container">
        {title && <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">{title}</h2>}
        <div className={`grid gap-4 grid-cols-1 ${colClasses[columns] || colClasses[3]}`}>
          {validImages.map((img, i) => (
            <div key={i} className="group relative aspect-square overflow-hidden rounded-xl border border-gray-200">
              <Image src={img.url} alt={img.alt || ""} fill className="object-cover transition-transform duration-300 group-hover:scale-105" />
              {img.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-3 text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                  {img.caption}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function VideoSection({ data }) {
  const { url, title, description, aspect_ratio = "16:9" } = data;
  if (!url) return null;

  const aspectClasses = { "16:9": "aspect-video", "4:3": "aspect-[4/3]", "1:1": "aspect-square", "21:9": "aspect-[21/9]" };

  return (
    <section className="section">
      <div className="container">
        {title && <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">{title}</h2>}
        <div className={`relative w-full ${aspectClasses[aspect_ratio] || aspectClasses["16:9"]} rounded-xl overflow-hidden bg-gray-100`}>
          <iframe
            src={url.includes("youtube.com") || url.includes("youtu.be") ? url.replace("watch?v=", "embed/") : url}
            className="absolute inset-0 w-full h-full"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        {description && <p className="mt-4 text-center text-gray-600 max-w-2xl mx-auto">{description}</p>}
      </div>
    </section>
  );
}

export function CTABannerSection({ data }) {
  const { title, description, button_text, button_link, background, text_color = "white", alignment = "center" } = data;
  if (!button_text || !button_link) return null;

  const alignments = { left: "text-left items-start", center: "text-center items-center", right: "text-right items-end" };
  const textColors = { white: "text-white", dark: "text-gray-900", primary: "text-green-800" };

  const bgStyle = background ? { backgroundImage: `url(${background})`, backgroundSize: "cover", backgroundPosition: "center" } : { background: "linear-gradient(135deg, var(--green) 0%, var(--dark) 100%)" };

  return (
    <section className="section" style={bgStyle}>
      <div className={`container relative flex flex-col justify-center min-h-[200px] ${alignments[alignment] || alignments.center} ${textColors[text_color] || textColors.white}`}>
        {title && <h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>}
        {description && <p className="text-lg mb-8 max-w-2xl opacity-90">{description}</p>}
        <Link href={button_link} className={`inline-flex items-center gap-2 px-8 py-3 rounded-full font-semibold transition-colors ${
          text_color === "white" ? "bg-white text-green-800 hover:bg-gray-100" :
          text_color === "dark" ? "bg-gray-900 text-white hover:bg-gray-800" :
          "bg-white text-green-800 hover:bg-gray-100"
        }`}>
          {button_text}
        </Link>
      </div>
    </section>
  );
}

export function DividerSection({ data }) {
  const { label, style = "line" } = data;
  if (!label && style === "none") return null;

  return (
    <section className="section" style={{ padding: "24px 0" }}>
      <div className="container">
        <div className="flex items-center gap-4">
          <div className="flex-1 border-t" style={{ borderColor: "var(--border)", borderStyle: style === "dashed" ? "dashed" : "solid" }} />
          {label && <span className="px-4 text-sm font-medium text-gray-500 whitespace-nowrap">{label}</span>}
          <div className="flex-1 border-t" style={{ borderColor: "var(--border)", borderStyle: style === "dashed" ? "dashed" : "solid" }} />
        </div>
      </div>
    </section>
  );
}

export function SpacerSection({ data }) {
  const { height = "medium" } = data;
  const heights = { small: "py-4", medium: "py-12", large: "py-24" };
  return <section className={`${heights[height] || heights.medium}`} aria-hidden="true" />;
}

export const sectionRenderers = {
  hero: HeroSection,
  richtext: RichTextSection,
  image_text: ImageTextSection,
  products: ProductsSection,
  categories: CategoriesSection,
  faq: FAQSection,
  reviews: ReviewsSection,
  image_gallery: ImageGallerySection,
  video: VideoSection,
  cta_banner: CTABannerSection,
  divider: DividerSection,
  spacer: SpacerSection,
};