import { notFound } from "next/navigation"; import Link from "next/link"; import ProductGrid from "@/components/ProductGrid"; import { loadProducts, loadCategoryBySlug, LIST_COLUMNS } from "@/lib/products-server"; import { categories } from "@/lib/products";

export const revalidate = 60;

export default async function Category({ params }) {
  const { slug } = await params;
  const c = await loadCategoryBySlug(slug);
  if (!c) notFound();
  const staticCat = categories.find((c) => c.slug === slug);
  const catName = staticCat?.name || c.name;
  const catIcon = staticCat?.icon || c.icon;
  const all = await loadProducts({ columns: LIST_COLUMNS });
  const items = all.filter((p) => p.category === c.slug);
  return <>
    <div className="page-head"><div className="container"><div className="crumb"><Link href="/">Home</Link> / Categories / {catName}</div><h1>{catIcon} {catName}</h1><p className="muted">{c.description}</p></div></div>
    <section className="section"><div className="container">
      {items.length ? <ProductGrid products={items}/> : <div className="empty">No products in this category yet.</div>}
    </div></section>
  </>;
}
