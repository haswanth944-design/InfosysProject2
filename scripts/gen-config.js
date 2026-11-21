// Reads .env and writes src/config.js (the browser cannot read .env directly).
import { readFileSync, writeFileSync } from 'node:fs';
const env = {};
for (const line of readFileSync(new URL('../.env', import.meta.url), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
}
if (!env.SUPABASE_URL || !env.SUPABASE_PUBLISHABLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY in .env');
  process.exit(1);
}
writeFileSync(new URL('../src/config.js', import.meta.url),
`// Generated from .env by scripts/gen-config.js. Public values only.
export const SUPABASE_URL = ${JSON.stringify(env.SUPABASE_URL)};
export const SUPABASE_PUBLISHABLE_KEY = ${JSON.stringify(env.SUPABASE_PUBLISHABLE_KEY)};
export const OTP_LENGTH = ${Number(env.OTP_LENGTH)||6};
export const REQUIRE_EMAIL_OTP = ${String(env.REQUIRE_EMAIL_OTP||'true').toLowerCase()!=='false'};
`);
console.log('src/config.js generated from .env');
