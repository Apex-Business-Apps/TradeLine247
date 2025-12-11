# Push Instructions for wallpaper-rollback-20251208

## Manual Push Steps

Since automated push isn't working, please run these commands manually in PowerShell:

```powershell
cd c:\Users\sinyo\TradeLine24-7\TradeLine247

# 1. Ensure you're on main and up to date
git checkout main
git pull origin main

# 2. Create the branch
git checkout -b wallpaper-rollback-20251208

# 3. Stage the changed files
git add src/sections/HeroRoiDuo.tsx
git add src/pages/Index.tsx
git add src/index.css
git add tests/hero-background.spec.ts
git add docs/HERO_BACKGROUND_TESTING_CHECKLIST.md
git add scripts/verify-hero-background.mjs

# 4. Verify what will be committed
git status

# 5. Commit
git commit -m "fix(ui): restore hero background responsiveness (wallpaper-rollback-20251208)

- Remove background from #app-home div (scoped to hero only)
- Add responsive Tailwind classes to HeroRoiDuo section
  - Mobile: bg-contain bg-top bg-no-repeat bg-scroll
  - Tablet+: md:bg-cover md:bg-top
  - Height: min-h-screen lg:min-h-screen
- Fix CSS conflict (remove background: transparent override)
- Add comprehensive test suite and verification scripts
- Preserve overlays, gradients, and all hero content

Fixes visual regression from recent commit. Restores Dec 4, 2025 build behavior."

# 6. Push to GitHub
git push -u origin wallpaper-rollback-20251208
```

## After Push - Create PR

Once pushed, create PR at:
**https://github.com/Apex-Business-Apps/TradeLine247/compare/main...wallpaper-rollback-20251208**

## Troubleshooting

If push fails with authentication error:
1. Check GitHub credentials: `git config --get credential.helper`
2. Use GitHub CLI: `gh auth login`
3. Or use SSH: `git remote set-url origin git@github.com:Apex-Business-Apps/TradeLine247.git`
