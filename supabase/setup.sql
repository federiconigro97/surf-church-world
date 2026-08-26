-- ============================================================
--  SURF CHURCH WORLD  ·  Supabase setup
--  Run this whole file once in:  Supabase Dashboard → SQL Editor
-- ============================================================

-- 1) Settings (the secret camp code lives here, never shipped to the browser)
create table if not exists public.app_settings (
  key   text primary key,
  value text not null
);
insert into public.app_settings (key, value)
values ('camp_code', 'SURFCAMP2026')          -- ← change the code here any time
on conflict (key) do update set value = excluded.value;
alter table public.app_settings enable row level security;   -- no policies = nobody can read it directly
revoke all on public.app_settings from anon, authenticated;

-- 2) Surfers (one row = one pin on the globe)
create table if not exists public.surfers (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  name        text not null check (char_length(name) between 2 and 40),
  city        text not null check (char_length(city) between 2 and 60),
  country     text not null default '',
  lat         double precision not null check (lat between -90 and 90),
  lng         double precision not null check (lng between -180 and 180),
  quote       text not null default '' check (char_length(quote) <= 140),
  instagram   text not null default '' check (char_length(instagram) <= 40),
  photo_url   text not null default '',
  color       text not null default '#6AC6E8',
  stoke       integer not null default 0,
  badges      jsonb not null default '[]'::jsonb
);
alter table public.surfers enable row level security;

-- Anyone can read pins; nobody can write to the table directly (writes go through the RPCs below)
grant usage on schema public to anon, authenticated;
revoke all on public.surfers from anon, authenticated;
grant select on public.surfers to anon, authenticated;
drop policy if exists "read surfers" on public.surfers;
create policy "read surfers" on public.surfers for select to anon, authenticated using (true);

-- Private edit tokens (one per pin). RLS enabled with NO policies = unreadable from the browser.
create table if not exists public.surfer_secrets (
  surfer_id   uuid primary key references public.surfers(id) on delete cascade,
  edit_token  uuid not null default gen_random_uuid()
);
alter table public.surfer_secrets enable row level security;
revoke all on public.surfer_secrets from anon, authenticated;

-- 3) RPC: check the camp code (used before uploading the photo)
create or replace function public.check_camp_code(p_code text)
returns boolean language sql security definer set search_path = public as $$
  select exists (select 1 from app_settings where key = 'camp_code' and upper(trim(value)) = upper(trim(p_code)));
$$;

-- 4) RPC: drop a pin (validates the code server-side, returns id + edit_token to the owner only)
create or replace function public.drop_pin(
  p_code text, p_name text, p_city text, p_country text,
  p_lat double precision, p_lng double precision,
  p_quote text, p_instagram text, p_photo_url text, p_color text
) returns json language plpgsql security definer set search_path = public as $$
declare new_id uuid; tok uuid;
begin
  if not check_camp_code(p_code) then
    raise exception 'WRONG_CODE';
  end if;
  insert into surfers (name, city, country, lat, lng, quote, instagram, photo_url, color, stoke, badges)
  values (trim(p_name), trim(p_city), coalesce(p_country,''), p_lat, p_lng, coalesce(p_quote,''),
          ltrim(trim(coalesce(p_instagram,'')), '@'), coalesce(p_photo_url,''), coalesce(p_color,'#6AC6E8'),
          50, '["dropped_in"]'::jsonb)
  returning id into new_id;
  insert into surfer_secrets (surfer_id) values (new_id) returning edit_token into tok;
  return json_build_object('id', new_id, 'edit_token', tok);
end $$;

-- 5) RPC: edit your own pin (needs the edit_token that the browser stored at drop time)
create or replace function public.update_pin(
  p_id uuid, p_token uuid, p_name text, p_city text, p_country text,
  p_lat double precision, p_lng double precision,
  p_quote text, p_instagram text, p_photo_url text, p_color text
) returns boolean language plpgsql security definer set search_path = public as $$
begin
  update surfers set
    name = trim(p_name), city = trim(p_city), country = coalesce(p_country,''),
    lat = p_lat, lng = p_lng, quote = coalesce(p_quote,''),
    instagram = ltrim(trim(coalesce(p_instagram,'')), '@'),
    photo_url = coalesce(nullif(p_photo_url,''), photo_url), color = coalesce(p_color, color),
    updated_at = now()
  where id = p_id and exists (select 1 from surfer_secrets where surfer_id = p_id and edit_token = p_token);
  return found;
end $$;

-- 6) RPC: add stoke points + badges (capped per call so nobody can spam a million points)
create or replace function public.add_stoke(p_id uuid, p_token uuid, p_points integer, p_badges jsonb default '[]'::jsonb)
returns integer language plpgsql security definer set search_path = public as $$
declare new_stoke integer;
begin
  update surfers set
    stoke = stoke + least(greatest(p_points, 0), 500),
    badges = (select coalesce(jsonb_agg(distinct b), '[]'::jsonb) from jsonb_array_elements(badges || coalesce(p_badges,'[]'::jsonb)) b),
    updated_at = now()
  where id = p_id and exists (select 1 from surfer_secrets where surfer_id = p_id and edit_token = p_token)
  returning stoke into new_stoke;
  return new_stoke;
end $$;

grant execute on function public.check_camp_code(text) to anon, authenticated;
grant execute on function public.drop_pin(text,text,text,text,double precision,double precision,text,text,text,text) to anon, authenticated;
grant execute on function public.update_pin(uuid,uuid,text,text,text,double precision,double precision,text,text,text,text) to anon, authenticated;
grant execute on function public.add_stoke(uuid,uuid,integer,jsonb) to anon, authenticated;

-- 7) Storage bucket for profile photos (public read, anon upload limited to images ≤ 2 MB)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 2097152,
  allowed_mime_types = array['image/jpeg','image/png','image/webp'];

drop policy if exists "avatars public read"  on storage.objects;
drop policy if exists "avatars anon upload"  on storage.objects;
create policy "avatars public read" on storage.objects for select to anon, authenticated using (bucket_id = 'avatars');
create policy "avatars anon upload" on storage.objects for insert to anon, authenticated with check (bucket_id = 'avatars');

-- 8) Realtime: new pins appear on everyone's globe instantly
do $$ begin
  alter publication supabase_realtime add table public.surfers;
exception when duplicate_object then null; end $$;

-- 9) The HQ pin (Surf Church Porto · Matosinhos) is drawn by the game itself, no row needed.
-- Optional demo rows (delete later):
-- select drop_pin('SURFCAMP2026','Marco Bianchi','Porto','Portugal',41.15,-8.61,'Faith. Waves. People.','marcobianchi','', '#FFD764');
