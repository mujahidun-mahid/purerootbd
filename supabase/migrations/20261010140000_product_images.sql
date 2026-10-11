-- Unlimited product gallery images. `image` stays as the cover for
-- backward compatibility; `images[0]` is the cover going forward.
alter table public.products
  add column if not exists images jsonb not null default '[]'::jsonb;

-- Backfill: products that already have a cover image get a 1-item gallery.
update public.products
set images = jsonb_build_array(image)
where (images is null or images = '[]'::jsonb)
  and image is not null
  and btrim(image) <> '';
