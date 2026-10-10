import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabaseServer";
import FaqExplorer from "@/components/FaqExplorer";

export const dynamic = "force-dynamic";

const FALLBACK_ITEMS = [
  { question: "Are your products fresh?", answer: "Yes. Every batch is sourced fresh and packed in small quantities.", category: "Orders & Products", enabled: true, order: 0 },
  { question: "Do you offer Cash on Delivery?", answer: "Yes. Cash on Delivery is available on all orders across Bangladesh.", category: "Payment Methods", enabled: true, order: 1 },
  { question: "How long does delivery take?", answer: "Delivery usually takes 2–5 business days depending on your location.", category: "Delivery & Shipping", enabled: true, order: 2 },
];

async function getFaqPage() {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) return null;
    const { data, error } = await supabase
      .from("site_pages")
      .select("*")
      .eq("slug", "faq")
      .eq("is_active", true)
      .single();
    if (error || !data) return null;
    return data;
  } catch {
    return null;
  }
}

function buildGroups(page) {
  const section = (page?.sections || []).find((s) => s.type === "faq" && s.enabled !== false);
  const raw = (section?.data?.items?.length ? section.data.items : FALLBACK_ITEMS)
    .filter((it) => it && it.question && it.answer && it.enabled !== false)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const groups = [];
  const seen = {};
  raw.forEach((it) => {
    const cat = (it.category || "").trim() || "General";
    if (!seen[cat]) {
      seen[cat] = { category: cat, items: [] };
      groups.push(seen[cat]);
    }
    seen[cat].items.push({ question: it.question, answer: it.answer });
  });
  return groups;
}

export async function generateMetadata() {
  const page = await getFaqPage();
  const title = page?.meta_title || page?.title || "FAQ | Pure Roots";
  const description =
    page?.meta_description ||
    "Find answers to common questions about Pure Roots products, orders, payments, delivery, and returns.";
  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
  };
}

export default async function FAQ() {
  // Null page (database unreachable) falls back to built-in content inside buildGroups.
  const page = await getFaqPage();
  const groups = buildGroups(page);
  const total = groups.reduce((n, g) => n + g.items.length, 0);
  if (!total) notFound();

  const title = page?.title || "Frequently Asked Questions";
  const subtitle =
    page?.hero_subtitle ||
    page?.meta_description ||
    "Find answers to common questions about Pure Roots products, orders, payments, delivery, and returns.";

  return (
    <>
      <div className="faq-hero">
        <div className="container">
          <div className="kicker">Help Center</div>
          <h1>{title}</h1>
          <p className="muted">{subtitle}</p>
        </div>
      </div>
      <section className="section">
        <div className="container" style={{ maxWidth: 860 }}>
          <FaqExplorer groups={groups} />
          <div className="faq-foot">
            <p className="muted">Still need help? Our team replies within one business day.</p>
            <Link className="btn btn-outline" href="/contact">Contact Support</Link>
          </div>
        </div>
      </section>
    </>
  );
}
