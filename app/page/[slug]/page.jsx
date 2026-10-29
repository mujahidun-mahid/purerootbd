import { notFound } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabaseServer";
import { sectionRenderers } from "@/components/PageSections";
import { sanitizeCmsHtml } from "@/lib/sanitize";

export const dynamic = "force-dynamic";

async function getPage(slug) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("site_pages")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (error || !data) return null;
  return data;
}

export async function generateMetadata({ params }) {
  const page = await getPage(params.slug);
  if (!page) {
    return { title: "Page not found" };
  }

  const title = page.meta_title || page.title;
  const description = page.meta_description || undefined;

  return {
    title,
    description,
    alternates: { canonical: `/page/${page.slug}` },
    openGraph: {
      title,
      description,
      type: "website",
      images: page.hero_image ? [page.hero_image] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

// IMPORTANT: App Router layouts already render <html> and <body>. Rendering a
// second document here (as CMS pages previously did) produces invalid nested
// markup and can break hydration. This page renders only its content and uses
// generateMetadata for the head fields.
export default async function Page({ params }) {
  const page = await getPage(params.slug);

  if (!page) {
    notFound();
  }

  return (
    <main style={{ minHeight: "100vh" }}>
      {(page.sections || []).map((section, index) => {
        if (!section.enabled) return null;
        const Renderer = sectionRenderers[section.type];
        return Renderer ? <Renderer key={index} data={section.data} /> : (
          <div key={index} className="muted" style={{ padding: 16, border: '1px dashed var(--border)', borderRadius: 8 }}>
            Unknown section type: {section.type}
          </div>
        );
      })}
      {!page.sections?.length && (
        <div className="container" style={{ padding: "40px 20px" }}>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{page.hero_title}</h1>
          {page.hero_subtitle && <p className="text-gray-600 mb-8 max-w-2xl">{page.hero_subtitle}</p>}
          {page.hero_image && (
            <div className="mb-8">
              <img src={page.hero_image} alt="" className="max-w-full h-auto rounded-lg" />
            </div>
          )}
          {page.hero_cta_text && page.hero_cta_link && (
            <a href={page.hero_cta_link} className="inline-flex items-center gap-2 bg-green-700 text-white px-6 py-3 rounded-full font-semibold hover:bg-green-800 transition-colors">
              {page.hero_cta_text}
            </a>
          )}
          <div className="prose prose-green max-w-none mt-8" dangerouslySetInnerHTML={{ __html: sanitizeCmsHtml(page.content_html || page.content_markdown) }} />
        </div>
      )}
    </main>
  );
}
