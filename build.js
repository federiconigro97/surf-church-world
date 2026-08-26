// Vercel build step: injects Supabase keys from environment variables into index.html → dist/index.html
// Locally you can just open index.html (demo mode) or run:  SUPABASE_URL=... SUPABASE_ANON_KEY=... node build.js
const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');
const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '', key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
if (url && key) {
  html = html.replace("SUPABASE_URL: 'YOUR_SUPABASE_URL'", `SUPABASE_URL: '${url}'`)
             .replace("SUPABASE_ANON_KEY: 'YOUR_SUPABASE_ANON_KEY'", `SUPABASE_ANON_KEY: '${key}'`);
  console.log('✔ Supabase keys injected → live mode');
} else console.log('ℹ No SUPABASE_URL / SUPABASE_ANON_KEY env vars → demo mode');
if (process.env.HQ_INSTAGRAM) html = html.replace("instagram:'', color:'#FF8B4D' }", `instagram:'${process.env.HQ_INSTAGRAM.replace(/^@/,'')}', color:'#FF8B4D' }`);
fs.mkdirSync('dist', { recursive: true });
fs.writeFileSync('dist/index.html', html);
console.log('✔ dist/index.html written (' + Math.round(html.length / 1024) + ' KB)');
