# Node & Env Policy – TradeLine 24/7

- Canonical Node version: **20.x**
  - `package.json` uses `"engines": { "node": "20.x" }`.
  - `.nvmrc` is set to `20`.
  - GitHub Actions uses Node 20 via `actions/setup-node`.
  - Vercel project settings should also use Node 20.x.

- Required public env vars (used by Vite frontend):
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

- Sources:
  - Local dev: `.env.local` (not committed).
  - CI: GitHub Actions secrets `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
  - Vercel: Project Settings → Environment Variables, set both for Production and Preview.

- CI:
  - `npm run -s verify:env:public` runs on main & same-repo PRs.
  - For PRs from forks, the verify step is skipped because secrets are not available.

