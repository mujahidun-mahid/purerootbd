import { NextResponse } from "next/server";
import { loadProducts } from "@/lib/products-server";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    const products = await loadProducts();
    const headers = { "cache-control": "no-store" };
    if (slug) {
      const product = products.find((p) => p.slug === slug) || null;
      return NextResponse.json({ product }, { headers });
    }
    return NextResponse.json({ products }, { headers });
  } catch (e) {
    console.error("GET /api/products failed:", e);
    return NextResponse.json({ error: "Could not load products" }, { status: 500 });
  }
}
