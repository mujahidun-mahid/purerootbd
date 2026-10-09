import { notFound } from "next/navigation";
import Link from "next/link";
import ProductGrid from "@/components/ProductGrid";
import { loadProducts, loadCategory } from "@/lib/products-server";
import { getPageByTemplate } from "@/lib/pages";
import { sectionRenderers } from "@/components/PageSections";

export const dynamic = "force-dynamic";

export default async function Category({ params }) {
  const [c, all, page] = await Promise.all([
    loadCategory(params.slug),
    loadProducts(),
    getPageByTemplate("category"),
  ]);

  if (!c) notFound();

  const items = all.filter((p) => p.category === c.slug);

  return (
    <>
      <div className="page-head">
        <div className="container">
          <div className="crumb">
            <Link href="/">Home</Link> / Categories / {c.name}
          </div>
          <h1>{c.icon} {c.name}</h1>
          <p className="muted">{c.description}</p>
        </div>
      </div>
      <section className="section">
        <div className="container">
          {page?.sections?.length ? (
            page.sections
              .filter((s) => s.enabled)
              .sort((a, b) => (a.order || 0) - (b.order || 0))
              .map((section, index) => {
                const Renderer = sectionRenderers[section.type];
                return Renderer ? (
                  <Renderer
                    key={`${section.id}-${index}`}
                    data={section.data}
                    products={items}
                    categories={[c]}
                  />
                ) : (
                  <div
                    key={`${section.id}-${index}`}
                    className="muted"
                    style={{ padding: 16, border: "1px dashed var(--border)", borderRadius: 8 }}
                  >
                    Unknown section type: {section.type}
                  </div>
                );
              })
          ) : (
            <>
              {items.length ? <ProductGrid products={items} /> : <div className="empty">No products in this category yet.</div>}
            </>
          )}
        </div>
      </section>
    </>
  );
}