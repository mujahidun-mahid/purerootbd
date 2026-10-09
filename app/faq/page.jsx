import { getPage } from "@/lib/pages";
import { sectionRenderers } from "@/components/PageSections";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const page = await getPage("faq");
  if (!page) return {};
  return {
    title: page.meta_title || page.title,
    description: page.meta_description || "",
    openGraph: {
      title: page.meta_title || page.title,
      description: page.meta_description || "",
      type: "website",
      ...(page.hero_image && { images: [{ url: page.hero_image }] }),
    },
  };
}

export default async function FAQ() {
  const page = await getPage("faq");

  if (!page) {
    notFound();
  }

  return (
    <>
      <div className="page-head">
        <div className="container">
          <h1>{page.title}</h1>
          {page.meta_description && <p className="muted">{page.meta_description}</p>}
        </div>
      </div>
      <main style={{ minHeight: "60vh" }}>
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
          <div className="container section">
            <div className="prose prose-green max-w-none" dangerouslySetInnerHTML={{ __html: page.content_html || page.content_markdown || "" }} />
          </div>
        )}
      </main>
    </>
  );
}