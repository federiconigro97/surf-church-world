# 🏄 Surf Church World

A 3D globe mini-game for the Surf Church surf-camp crew. Find your friends on a real-country globe, surf around it to unlock their profile cards, and drop your own pin (photo, quote, Instagram). Home base: **Surf Church Porto, Matosinhos**.

![Surf mode](docs/preview-surf-mode.jpg)

Everything is one file — `index.html` — using globe.gl (three.js), GSAP, canvas-confetti and supabase-js from CDNs. `build.js` only injects the Supabase keys from environment variables at deploy time.

## Go live in 10 minutes

### 1 · Supabase (database + photo storage)

1. Create a free project at [supabase.com](https://supabase.com).
2. **SQL Editor → New query** → paste the whole of [`supabase/setup.sql`](supabase/setup.sql) → **Run**.
   - The camp code lives on line 12: `SURFCAMP2024`. Change it there whenever you want (the browser never sees it).
3. **Project Settings → API** → copy the **Project URL** and the **anon public** key (the anon key is designed to be public; all protection is done by Row Level Security and the SQL functions).

### 2 · Vercel (hosting)

1. [vercel.com](https://vercel.com) → **Add New… → Project** → **Import** this GitHub repo. `vercel.json` already sets the build (`node build.js` → `dist/`).
2. **Settings → Environment Variables** → add `SUPABASE_URL` and `SUPABASE_ANON_KEY` (optional: `HQ_INSTAGRAM`). Redeploy.
3. Every push to `main` redeploys automatically. Use the `*.vercel.app` URL or add your own domain.

Without the two variables the site runs in **demo mode** (7 sample friends, pins saved only in the browser, any camp code of 3+ characters is accepted).

Other hosts (Netlify, Cloudflare Pages, GitHub Pages) work too: either set the same env vars with build command `node build.js` / output `dist`, or paste the keys straight into `CONFIG` at the top of the script in `index.html`. It must be served over **https** for photo upload and the share button.

## How to play

- **Explore** — drag the globe, hover countries, tap a pin to open a card (photo · quote · Instagram · km from HQ). Search by name, city or country.
- **Surf mode** — your board never stops, you steer. `←` `→` or drag to steer; `Space`, the AIR button, or a quick click/tap on the ocean to launch; flick `↑ ↓ ← →` (or swipe) while airborne for a Cutback / Snap / Floater / Aerial. Two flicks = alley-oop. Chain tricks within 3 s for a combo. Follow the yellow arrow to the nearest friend; reach the pin to unlock them. Land = wipeout, you respawn in the water.
- **Add your pin** — camp code → name → city (geocoded via OpenStreetMap, then fine-tune by tapping the globe) → photo (resized in the browser) → quote → Instagram → pin colour.

## Gamification

| Action | Stoke |
|---|---|
| Drop your pin | +50 + badge *Dropped In* |
| Discover a friend's card (explore) | +10 |
| Paddle up to a friend (surf mode) | +25 |
| Paddle up to HQ | +25 + badge *Homecoming* |
| Catch a wave token | +10 |
| Trick / Aerial | +40 / +60 × combo, ×1.5 alley-oop |
| Wipeout ("Hall of Meat") | +15 + 5 per combo |
| 5 quests | +50 … +100 |
| 8 badges (your stickers) | +20 … +100 |

Leaderboard, crew stats (countries, furthest member, total km from HQ), quests and badges are in the side panel. New pins appear live for everyone (Supabase Realtime + 60 s fallback poll).

## Security model (no login, nothing to abuse)

- The browser can only **read** `surfers`. All writes go through SQL functions: `drop_pin` checks the camp code server-side; `update_pin` / `add_stoke` need a private `edit_token` that only the pin owner's browser received when it dropped the pin.
- `app_settings` (camp code) and `surfer_secrets` (tokens) have RLS enabled with no policies → unreadable with the anon key.
- Stoke is capped at 500 points per call; photos ≤ 2 MB, images only, resized to 420 px client-side.

## Tweaks

- `CONFIG.SCORE` — point values · `CONFIG.PIN_COLORS` / `LAND_COLORS` — palette
- `BADGES` / `QUESTS` — names, descriptions, thresholds
- `G.speed` (surf speed) and `altTarget: 0.55` in `startSurf()` (camera zoom)
- Reset a browser's local progress: DevTools → Application → Local Storage → delete the `scw_*` keys
