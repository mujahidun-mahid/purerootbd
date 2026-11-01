import { NextResponse } from "next/server";
import { loadProducts, loadProductBySlug, LIST_COLUMNS } from "@/lib/products-server";

// ISR: revalidate public product listings every 60 seconds.
export const revalidate = 60;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    const headers = { "cache-control": "public, max-age=60, s-maxage=60" };
    if (slug) {
      const product = await loadProductBySlug(slug);
      return NextResponse.json({ product }, { headers });
    }
    const products = await loadProducts({ columns: LIST_COLUMNS });
    return NextResponse.json({ products }, { headers });
  } catch (e) {
    console.error("GET /api/products failed:", e);
    return NextResponse.json({ error: "Could not load products" }, { status: 500 });
  }
}
