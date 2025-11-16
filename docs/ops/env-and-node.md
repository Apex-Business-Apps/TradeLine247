# Node & Env Policy

- Canonical Node version: 20.x
- `package.json` uses `"engines": { "node": "20.x" }`.
- `.nvmrc` is set to `20` for local dev.
- Vercel project settings should also use Node 20.x so the dashboard matches reality.

Env policy:

- Required public env vars for frontend:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- Sources:
  - Local dev: `.env.local` (not committed)
  - GitHub Actions: repository secrets `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
  - Vercel: project env config with the same names
- CI:
  - `npm run -s verify:env:public` runs on `main` and same-repo PRs.
  - For PRs from forks, env verification is skipped (no secrets available).
