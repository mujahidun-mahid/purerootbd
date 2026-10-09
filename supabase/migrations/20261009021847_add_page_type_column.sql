-- Add page_type column to existing site_pages table
alter table public.site_pages add column if not exists page_type text not null default 'custom';

create index if not exists site_pages_type_idx on public.site_pages(page_type);

-- Update existing pages to have page_type = 'system' for known system pages
update public.site_pages set page_type = 'system' where slug in (
  'home', 'shop', 'categories', 'about', 'reviews', 'faq', 'contact',
  'shipping', 'returns', 'terms', 'privacy'
);