# Stabilization Window — Oct 30–Nov 6, 2025 (America/Edmonton)

## Goals
- Hold the green checks while inbound traffic increases.
- Catch perf and dependency regressions automatically.

## Rules
1. **Light freeze**: Keep PRs flowing, but merges require all checks green. No force-pushes to default branch.
2. **Required checks**: Pin `ci/lint`, `ci/build`, `ci/test`, `ci/lighthouse` under  
   **Repo → Settings → Branches → Branch protection rules → Require status checks to pass**.
3. **Runtime visibility**:
   - Vercel: watch function duration, error rate, and LCP via dashboards; add a Notebook for “LCP & Largest Images”.
   - Supabase: monitor Edge Functions logs and DB Reports; add a log drain if available on your plan.
4. **Perf budgets in CI**: `.lighthousebudgets.json` enforces LCP / bytes. Tighten after baseline.
5. **Dependencies**: Dependabot opens weekly PRs (Mon 09:00). Keep under 5 open at a time.

## Acceptance Criteria
- All protected branches reject merges unless `ci/lint`, `ci/build`, `ci/test`, `ci/lighthouse` are green.
- Lighthouse report artifact is attached to every PR. Budgets pass on the main user journey URL.
- No critical errors in Vercel/Supabase dashboards sustained >30 minutes without an issue opened.

## Rollback
- To disable perf gating temporarily: uncheck `ci/lighthouse` in Branch protection (leave the workflow in place).
- To pause Dependabot: set its schedule interval to `monthly` or comment out the block (no code deletes needed).
