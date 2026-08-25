create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  quote text,
  instagram text,
  avatar_url text,
  city text,
  country text,
  lat double precision not null check (lat between -90 and 90),
  lon double precision not null check (lon between -180 and 180),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
drop policy if exists "Public profiles are readable" on public.profiles;
create policy "Public profiles are readable" on public.profiles for select using (true);
drop policy if exists "Anyone can add a profile" on public.profiles;
create policy "Anyone can add a profile" on public.profiles for insert with check (true);
create index if not exists profiles_lat_lon_idx on public.profiles (lat, lon);
