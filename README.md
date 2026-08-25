# Surf Church World

Interactive 3D world for the Surf Church community.

## Features
- Real 3D globe with individually styled country polygons
- Friend pins around the world
- Search by name
- Click pins for profiles
- Surf Church Porto HQ at Matosinhos, Portugal
- Stylized landmark objects and sticker UI inspired by early-2000s skate/surf games
- Add-your-pin flow without login
- Supabase persistence
- Vite + Vercel ready

## Local development

1. `npm install`
2. Copy `.env.example` to `.env.local`
3. Add your Supabase URL and publishable/anon key
4. `npm run dev`

## Vercel

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the Vercel project environment variables. The build command is `npm run build` and output is `dist`.

## Supabase

Run `supabase.sql` in the SQL editor if the profiles table has not already been created.

Note: location search currently uses the public Nominatim geocoder. For production, use a dedicated geocoding provider and add rate limiting/consent controls.
