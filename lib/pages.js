import { getSupabaseAdmin } from "./supabaseServer";

export async function getPage(slug) {
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

export async function getPageByTemplate(template) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("site_pages")
    .select("*")
    .eq("template", template)
    .eq("is_active", true)
    .single();

  if (error || !data) return null;
  return data;
}

export async function getPages({ includeInactive = false } = {}) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];

  let query = supabase
    .from("site_pages")
    .select("*")
    .order("nav_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (!includeInactive) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;

  if (error) return [];
  return data || [];
}

export async function getSystemPages() {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("site_pages")
    .select("*")
    .eq("page_type", "system")
    .order("nav_order", { ascending: true });

  if (error) return [];
  return data || [];
}

export async function getCustomPages() {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("site_pages")
    .select("*")
    .eq("page_type", "custom")
    .order("created_at", { ascending: false });

  if (error) return [];
  return data || [];
}