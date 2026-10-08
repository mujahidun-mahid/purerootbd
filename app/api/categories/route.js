import { NextResponse } from "next/server";
import { loadCategories } from "@/lib/products-server";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const all = searchParams.get("all") === "1";
    const categories = await loadCategories({ includeInactive: all });
    return NextResponse.json(
      { categories },
      { headers: { "cache-control": "no-store" } }
    );
  } catch (e) {
    console.error("GET /api/categories failed:", e);
    return NextResponse.json({ error: "Could not load categories" }, { status: 500 });
  }
}
