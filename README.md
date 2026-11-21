# NeuroForge Nexus

Role-based sign-in (Admin, Project Manager, Developer, Tester, DevOps Engineer) on Supabase Auth + PostgreSQL.

## Run (no build step, no native binaries)
1. Settings live in `.env` (SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY). Use only the publishable key. Never put the service_role key or an SMTP password here.
2. `npm start` (or `npm run dev`). It writes `src/config.js` from `.env`, then serves http://localhost:5173
3. Alternative: run `npm run config` once, then use VS Code Live Server on index.html, or `python -m http.server 5173`.

Needs internet (Supabase library and icons load from a CDN). SMTP for the emailed codes is configured in the Supabase dashboard, not in this project.

## Supabase dashboard (one time)
- Authentication > Providers: Email enabled, Confirm email ON.
- Authentication > Emails: in the Confirm signup, Magic Link and Reset Password templates, show the code with `{{ .Token }}` instead of a link.
- Authentication > SMTP: set your own SMTP server (the built-in sender is heavily rate limited).
- Sign up once in the app, then run in the SQL editor to make yourself the first admin:
  `update public.profiles set role='admin', account_status='active' where email='YOUR_EMAIL';`

## How access works
- Sign up creates a pending profile; a requested role is only a request. Admins approve users on the Admin dashboard.
- Sign in checks password, verifies the account is active and matches the chosen role, then emails a 6-digit code.
- Roles live in `public.profiles`; row-level security blocks users from changing their own role. Dashboard routes are also checked in the browser, but the database is the real enforcement.

## OTP length
`OTP_LENGTH` in `.env` must equal Supabase > Authentication > Sign In / Providers > Email > Email OTP Length (currently 8). Change both together, then run `npm start`.
