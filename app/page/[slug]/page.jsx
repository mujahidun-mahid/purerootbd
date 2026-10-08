import { notFound } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabaseServer";
import { sectionRenderers } from "@/components/PageSections";

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

export default async function Page({ params }) {
  const page = await getPage(params.slug);
  
  if (!page) {
    notFound();
  }

  return (
    <html lang="en">
      <head>
        <title>{page.meta_title || page.title}</title>
        <meta name="description" content={page.meta_description || ""} />
        <meta property="og:title" content={page.meta_title || page.title} />
        <meta property="og:description" content={page.meta_description || ""} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={page.meta_title || page.title} />
        <meta name="twitter:description" content={page.meta_description || ""} />
        {page.hero_image && <meta property="og:image" content={page.hero_image} />}
      </head>
      <body>
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
              <div className="prose prose-green max-w-none mt-8" dangerouslySetInnerHTML={{ __html: page.content_html || page.content_markdown }} />
            </div>
          )}
        </main>
      </body>
    </html>
  );
}