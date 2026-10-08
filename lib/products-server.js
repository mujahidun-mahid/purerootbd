import { products as fallbackProducts } from "./products";
import { getSupabaseAdmin } from "./supabaseServer";

const COLUMNS =
  'id,name,slug,category,price,old_price,image,stock,packages,rating,reviews,short,description,ingredients,nutrition,benefits,use,storage,related,active,created_at';

export function rowToProduct(r) {
  if (!r) return null;
  return {
    id: r.id,
    name: r.name,
    slug: r.slug,
    category: r.category,
    price: Number(r.price || 0),
    oldPrice: r.old_price === null || r.old_price === undefined ? null : Number(r.old_price),
    image: r.image || "",
    stock: r.stock === null || r.stock === undefined ? 0 : Number(r.stock),
    packages: Array.isArray(r.packages) && r.packages.length ? r.packages : [{ size: "500g", price: Number(r.price || 0) }],
    rating: Number(r.rating || 0),
    reviews: Number(r.reviews || 0),
    short: r.short || "",
    description: r.description || "",
    ingredients: r.ingredients || "",
    nutrition: r.nutrition || "",
    benefits: r.benefits || "",
    use: r.use || "",
    storage: r.storage || "",
    related: Array.isArray(r.related) ? r.related : [],
    active: r.active !== false
  };
}

export function productToRow(p) {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    category: p.category,
    price: Number(p.price || 0),
    old_price: p.oldPrice === null || p.oldPrice === undefined || p.oldPrice === "" ? null : Number(p.oldPrice),
    image: p.image || "",
    stock: p.stock === null || p.stock === undefined ? 0 : Number(p.stock),
    packages: p.packages || [],
    rating: Number(p.rating || 0),
    reviews: Number(p.reviews || 0),
    short: p.short || "",
    description: p.description || "",
    ingredients: p.ingredients || "",
    nutrition: p.nutrition || "",
    benefits: p.benefits || "",
    use: p.use || "",
    storage: p.storage || "",
    related: p.related || [],
    active: p.active !== false
  };
}

export async function loadProducts({ includeInactive = false } = {}) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return fallbackProducts;
  try {
    let query = supabase
      .from("products")
      .select(COLUMNS)
      .order("created_at", { ascending: true });
    if (!includeInactive) query = query.eq("active", true);
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(rowToProduct).filter(Boolean);
  } catch (e) {
    console.warn("loadProducts: falling back to static registry:", e.message);
    return fallbackProducts;
  }
}

export async function loadProduct(slug) {
  const list = await loadProducts();
  return list.find((p) => p.slug === slug) || null;
}
