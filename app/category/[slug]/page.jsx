import {notFound} from "next/navigation"; import Link from "next/link"; import ProductGrid from "@/components/ProductGrid"; import {categories} from "@/lib/products"; import {loadProducts} from "@/lib/products-server";

export const dynamic = "force-dynamic";

export default async function Category({params}){
  const c=categories.find(x=>x.slug===params.slug);
  if(!c) notFound();
  const all=await loadProducts();
  const items=all.filter(p=>p.category===c.slug);
  return <>
    <div className="page-head"><div className="container"><div className="crumb"><Link href="/">Home</Link> / Categories / {c.name}</div><h1>{c.icon} {c.name}</h1><p className="muted">{c.description}</p></div></div>
    <section className="section"><div className="container">
      {items.length ? <ProductGrid products={items}/> : <div className="empty">No products in this category yet.</div>}
    </div></section>
  </>;
}
