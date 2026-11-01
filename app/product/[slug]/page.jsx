import { notFound } from "next/navigation";
import { loadProductBySlug, loadProducts, LIST_COLUMNS } from "@/lib/products-server";
import ProductDetails from "@/components/ProductDetails";
import ProductReviews from "@/components/ProductReviews";

// ISR: revalidate product detail pages every 60 seconds so admin content
// updates (price, stock, status) become visible without a redeploy.
export const revalidate = 60;

export default async function ProductPage({ params }) {
  const { slug } = await params;
  const p = await loadProductBySlug(slug);
  if (!p) notFound();

  // Fetch only light listing columns for related products.
  const all = await loadProducts({ columns: LIST_COLUMNS });
  const related = all.filter((x) => p.related?.includes(x.slug));

  return (
    <>
      <div className="container">
        <ProductDetails product={p} related={related} />
      </div>
      <ProductReviews slug={p.slug} />
    </>
  );
}
