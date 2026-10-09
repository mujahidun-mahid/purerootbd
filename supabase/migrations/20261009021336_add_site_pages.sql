-- =========================================================
-- PURE ROOTS E-COMMERCE - SITE PAGES TABLE
-- =========================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------
-- SITE PAGES TABLE
-- ---------------------------------------------------------
create table if not exists public.site_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text,
  meta_title text,
  meta_description text,
  hero_title text,
  hero_subtitle text,
  hero_image text,
  hero_cta_text text,
  hero_cta_link text,
  content_html text,
  content_markdown text,
  sections jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  show_in_nav boolean not null default false,
  nav_order integer not null default 0,
  template text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists site_pages_slug_idx on public.site_pages(slug);
create index if not exists site_pages_active_idx on public.site_pages(is_active);
create index if not exists site_pages_nav_idx on public.site_pages(show_in_nav, nav_order);

create or replace function public.set_site_pages_updated_at()
returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists site_pages_updated_at on public.site_pages;
create trigger site_pages_updated_at
before update on public.site_pages
for each row execute function public.set_site_pages_updated_at();

-- ---------------------------------------------------------
-- RLS POLICIES
-- ---------------------------------------------------------
alter table public.site_pages enable row level security;

drop policy if exists "Allow public read active pages" on public.site_pages;
create policy "Allow public read active pages" on public.site_pages
  for select to anon, authenticated using (is_active = true);

-- Admin policies handled by service_role in API routes

-- ---------------------------------------------------------
-- REALTIME
-- ---------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname='supabase_realtime' and schemaname='public' and tablename='site_pages'
  ) then
    alter publication supabase_realtime add table public.site_pages;
  end if;
exception when others then
  null;
end $$;

drop trigger if exists site_pages_admin_broadcast on public.site_pages;
create trigger site_pages_admin_broadcast
after insert or update or delete on public.site_pages
for each row execute function public.broadcast_admin_data_change();

-- ---------------------------------------------------------
-- DEFAULT PAGES FOR EXISTING ROUTES
-- ---------------------------------------------------------

-- Home Page
insert into public.site_pages (slug, title, meta_title, meta_description, hero_title, hero_subtitle, hero_cta_text, hero_cta_link, template, is_active, show_in_nav, nav_order, sections)
values (
  'home',
  'Home',
  'Pure Roots | Premium Nutrition & Natural Foods',
  'Premium nuts, seeds, spices, natural honey and nutrition-focused foods in Bangladesh. Freshly packed, Cash on Delivery available nationwide.',
  'Nature''s Nutrition, Delivered Pure',
  'Premium nuts, seeds, spices, natural honey and nutritious food mixes, carefully selected for your everyday wellness.',
  'Shop Now',
  '/shop',
  'home',
  true,
  true,
  1,
  '[
    {"id": "hero-main", "type": "hero", "enabled": true, "order": 0, "data": {"title": "Nature''s Nutrition, Delivered Pure", "subtitle": "Premium nuts, seeds, spices, natural honey and nutritious food mixes, carefully selected for your everyday wellness.", "cta_text": "Shop Now", "cta_link": "/shop", "alignment": "left", "height": "large"}},
    {"id": "featured-categories", "type": "categories", "enabled": true, "order": 1, "data": {"title": "Featured Categories", "show_all_link": true, "all_link": "/shop"}},
    {"id": "best-sellers", "type": "products", "enabled": true, "order": 2, "data": {"title": "Best Sellers", "source": "featured", "limit": 8, "show_view_all": true, "view_all_link": "/shop"}},
    {"id": "benefits", "type": "richtext", "enabled": true, "order": 3, "data": {"content": "<div class=\"grid benefits\"><div class=\"benefit\"><span>✓</span><strong>Quality Focused</strong></div><div class=\"benefit\"><span>✦</span><strong>Premium Ingredients</strong></div><div class=\"benefit\"><span>◌</span><strong>Freshly Packed</strong></div><div class=\"benefit\"><span>♡</span><strong>Trusted Products</strong></div><div class=\"benefit\"><span>→</span><strong>Fast Delivery</strong></div><div class=\"benefit\"><span>▣</span><strong>Secure Payment</strong></div></div>"}},
    {"id": "story-cta", "type": "image_text", "enabled": true, "order": 4, "data": {"title": "Make everyday food more nourishing.", "content": "<p>Nuts and seeds can add texture and plant-based nutrients to breakfast bowls, salads and snacks. Natural spices bring aroma and flavour, while honey adds natural sweetness.</p>", "image_position": "right", "alignment": "left"}},
    {"id": "newsletter", "type": "cta_banner", "enabled": true, "order": 5, "data": {"title": "Stay in the loop", "description": "Get nutrition tips, new product updates & special offers.", "button_text": "Subscribe", "button_link": "/newsletter", "background": "", "text_color": "primary", "alignment": "center"}}
  ]'::jsonb
) on conflict (slug) do nothing;

-- Shop Page
insert into public.site_pages (slug, title, meta_title, meta_description, hero_title, hero_subtitle, template, is_active, show_in_nav, nav_order, sections)
values (
  'shop',
  'Shop',
  'Shop Pure Nutrition | Pure Roots',
  'Browse premium pantry staples for everyday wellness. Premium nuts, seeds, spices, honey and more.',
  'Shop Pure Nutrition',
  'Browse premium pantry staples for everyday wellness.',
  'shop',
  true,
  true,
  2,
  '[
    {"id": "shop-hero", "type": "hero", "enabled": true, "order": 0, "data": {"title": "Shop Pure Nutrition", "subtitle": "Browse premium pantry staples for everyday wellness.", "alignment": "center", "height": "medium"}},
    {"id": "product-grid", "type": "products", "enabled": true, "order": 1, "data": {"title": "All Products", "source": "featured", "limit": 0, "show_view_all": false}}
  ]'::jsonb
) on conflict (slug) do nothing;

-- Categories Page (uses category template for each category)
insert into public.site_pages (slug, title, meta_title, meta_description, hero_title, hero_subtitle, template, is_active, show_in_nav, nav_order, sections)
values (
  'categories',
  'Categories',
  'Categories | Pure Roots',
  'Explore our product categories: nuts, seeds, spices, honey and more.',
  'Shop by Category',
  'Discover our curated selection of premium natural foods.',
  'category',
  true,
  true,
  3,
  '[
    {"id": "categories-hero", "type": "hero", "enabled": true, "order": 0, "data": {"title": "Shop by Category", "subtitle": "Discover our curated selection of premium natural foods.", "alignment": "center", "height": "medium"}},
    {"id": "category-grid", "type": "categories", "enabled": true, "order": 1, "data": {"title": "All Categories", "show_all_link": false}}
  ]'::jsonb
) on conflict (slug) do nothing;

-- About Page
insert into public.site_pages (slug, title, meta_title, meta_description, hero_title, hero_subtitle, template, is_active, show_in_nav, nav_order, sections)
values (
  'about',
  'About Us',
  'About Pure Roots | Premium Nutrition & Natural Foods',
  'Learn about Pure Roots - premium nutrition and natural foods in Bangladesh. Quality sourcing, freshness, transparency and clean shopping experience.',
  'About Pure Roots',
  'Natural nutrition, thoughtful sourcing and customer trust.',
  'about',
  true,
  true,
  4,
  '[
    {"id": "about-hero", "type": "hero", "enabled": true, "order": 0, "data": {"title": "About Pure Roots", "subtitle": "Natural nutrition, thoughtful sourcing and customer trust.", "alignment": "center", "height": "medium"}},
    {"id": "our-story", "type": "richtext", "enabled": true, "order": 1, "data": {"content": "<div class=\"kicker\">Our story</div><h2 class=\"serif\">Good food starts with good choices.</h2><p class=\"muted\">Pure Roots is a premium nutrition and natural-food concept built around quality sourcing, freshness, transparency and a clean shopping experience.</p><p class=\"muted\">Our range focuses on nuts, seeds, spices, natural honey and nutritious mixes that fit naturally into everyday routines.</p>"}},
    {"id": "values", "type": "richtext", "enabled": true, "order": 2, "data": {"content": "<h2 class=\"serif\">Our Values</h2><ul><li><strong>Quality First</strong> - Every product meets our strict standards</li><li><strong>Transparency</strong> - Clear sourcing and ingredient information</li><li><strong>Freshness</strong> - Small batches, freshly packed</li><li><strong>Customer Trust</strong> - Built on honest service</li></ul>"}}
  ]'::jsonb
) on conflict (slug) do nothing;

-- Reviews Page
insert into public.site_pages (slug, title, meta_title, meta_description, hero_title, hero_subtitle, template, is_active, show_in_nav, nav_order, sections)
values (
  'reviews',
  'Customer Reviews',
  'Customer Reviews | Pure Roots',
  'Read verified customer reviews and testimonials for Pure Roots premium nutrition products.',
  'Customer Reviews',
  'A dedicated space for verified customer feedback.',
  'reviews',
  true,
  true,
  5,
  '[
    {"id": "reviews-hero", "type": "hero", "enabled": true, "order": 0, "data": {"title": "Customer Reviews", "subtitle": "A dedicated space for verified customer feedback.", "alignment": "center", "height": "medium"}},
    {"id": "reviews-grid", "type": "reviews", "enabled": true, "order": 1, "data": {"title": "What Our Customers Say"}},
    {"id": "submit-review", "type": "cta_banner", "enabled": true, "order": 2, "data": {"title": "Share Your Experience", "description": "Have you tried our products? We''d love to hear your thoughts!", "button_text": "Submit a Review", "button_link": "/reviews#submit", "alignment": "center"}}
  ]'::jsonb
) on conflict (slug) do nothing;

-- FAQ Page
insert into public.site_pages (slug, title, meta_title, meta_description, hero_title, hero_subtitle, template, is_active, show_in_nav, nav_order, sections)
values (
  'faq',
  'Frequently Asked Questions',
  'FAQ | Pure Roots',
  'Find answers to frequently asked questions about Pure Roots products, delivery, payments and orders.',
  'Frequently Asked Questions',
  'Helpful answers about products, delivery, payments and orders.',
  'faq',
  true,
  true,
  6,
  '[
    {"id": "faq-hero", "type": "hero", "enabled": true, "order": 0, "data": {"title": "Frequently Asked Questions", "subtitle": "Helpful answers about products, delivery, payments and orders.", "alignment": "center", "height": "medium"}},
    {"id": "faq-section", "type": "faq", "enabled": true, "order": 1, "data": {"title": "Common Questions", "items": [{"question": "Are your products fresh?", "answer": "Yes! All our products are sourced fresh and packed in small batches to ensure maximum freshness and quality."}, {"question": "How are products packaged?", "answer": "Products are packaged in food-grade, airtight containers to preserve freshness and prevent contamination."}, {"question": "What package sizes are available?", "answer": "We offer various sizes from 100g to 1kg depending on the product. Check individual product pages for available options."}, {"question": "How long does delivery take?", "answer": "Delivery typically takes 2-5 business days within Bangladesh, depending on your location."}, {"question": "Do you offer Cash on Delivery?", "answer": "Yes! Cash on Delivery is available for all orders within Bangladesh."}, {"question": "Which payment methods are available?", "answer": "We accept Cash on Delivery, bKash, Nagad, and major credit/debit cards."}, {"question": "Can I return a product?", "answer": "Yes, we accept returns within 7 days for unopened products in original packaging. See our Returns Policy for details."}, {"question": "How can I track my order?", "answer": "Use the Track Order page with your order number and phone number to get real-time updates."}, {"question": "How should nuts and seeds be stored?", "answer": "Store in a cool, dry place in airtight containers. For maximum freshness, refrigerate after opening."}, {"question": "Are the products suitable for everyday consumption?", "answer": "Absolutely! Our nuts, seeds, spices and honey are perfect for daily nutrition and wellness routines."}]}}
  ]'::jsonb
) on conflict (slug) do nothing;

-- Contact Page
insert into public.site_pages (slug, title, meta_title, meta_description, hero_title, hero_subtitle, template, is_active, show_in_nav, nav_order, sections)
values (
  'contact',
  'Contact Us',
  'Contact Us | Pure Roots',
  'Get in touch with Pure Roots. Phone, email, business address and contact form for product inquiries, orders and delivery support.',
  'Contact Us',
  'We''re here to help with products, orders and delivery.',
  'contact',
  true,
  true,
  7,
  '[
    {"id": "contact-hero", "type": "hero", "enabled": true, "order": 0, "data": {"title": "Contact Us", "subtitle": "We''re here to help with products, orders and delivery.", "alignment": "center", "height": "medium"}},
    {"id": "contact-info", "type": "richtext", "enabled": true, "order": 1, "data": {"content": "<h2>Get in touch</h2><p class=\"muted\">Phone: +880 1XXXXXXXXX</p><p class=\"muted\">Email: hello@pureroots.example</p><p class=\"muted\">Business address: Bangladesh</p><div class=\"story-box\" style=\"margin-top:20px;\">Google Maps placeholder</div>"}},
    {"id": "contact-form", "type": "richtext", "enabled": true, "order": 2, "data": {"content": "<form><div class=\"form-grid\"><div><label>Name</label><input class=\"input\" type=\"text\" required/></div><div><label>Phone</label><input class=\"input\" type=\"tel\" required/</div><div><label>Email</label><input class=\"input\" type=\"email\" required/></div><div><label>Subject</label><input class=\"input\" type=\"text\" required/></div><div class=\"full\"><label>Message</label><textarea class=\"input\" rows=\"6\" required></textarea></div></div><button class=\"btn btn-primary\" style=\"margin-top:15px;\">Send Message</button></form>"}}
  ]'::jsonb
) on conflict (slug) do nothing;

-- Shipping Page
insert into public.site_pages (slug, title, meta_title, meta_description, hero_title, hero_subtitle, template, is_active, show_in_nav, nav_order, sections)
values (
  'shipping',
  'Shipping Information',
  'Shipping Information | Pure Roots',
  'Delivery zones, fees, timelines and shipping policies for Pure Roots orders across Bangladesh.',
  'Shipping Information',
  'Delivery zones, fees, timelines and shipping policies.',
  'shipping',
  true,
  false,
  0,
  '[]'::jsonb
) on conflict (slug) do nothing;

-- Returns Page
insert into public.site_pages (slug, title, meta_title, meta_description, hero_title, hero_subtitle, template, is_active, show_in_nav, nav_order, sections)
values (
  'returns',
  'Returns Policy',
  'Returns Policy | Pure Roots',
  'Return and refund policy, process, conditions and timelines for Pure Roots orders.',
  'Returns Policy',
  'Return/refund policy, process, conditions.',
  'returns',
  true,
  false,
  0,
  '[]'::jsonb
) on conflict (slug) do nothing;

-- Terms Page
insert into public.site_pages (slug, title, meta_title, meta_description, hero_title, hero_subtitle, template, is_active, show_in_nav, nav_order, sections)
values (
  'terms',
  'Terms of Service',
  'Terms of Service | Pure Roots',
  'Legal terms and conditions for using Pure Roots website and services.',
  'Terms of Service',
  'Legal terms and conditions.',
  'terms',
  true,
  false,
  0,
  '[]'::jsonb
) on conflict (slug) do nothing;

-- Privacy Page
insert into public.site_pages (slug, title, meta_title, meta_description, hero_title, hero_subtitle, template, is_active, show_in_nav, nav_order, sections)
values (
  'privacy',
  'Privacy Policy',
  'Privacy Policy | Pure Roots',
  'Data privacy and cookie policy for Pure Roots website.',
  'Privacy Policy',
  'Data privacy and cookie policy.',
  'privacy',
  true,
  false,
  0,
  '[]'::jsonb
) on conflict (slug) do nothing;