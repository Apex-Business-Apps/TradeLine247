# How to Commit and Push - Step by Step

## Step 1: Save Your Current Commit (if editor is open)
- **VS Code**: Click ✓ checkmark button OR press `Ctrl+S` then close tab
- **Vim**: Press `Esc` then type `:wq` then press Enter
- **Nano**: Press `Ctrl+X` then `Y` then Enter

## Step 2: Stage Hero Background Files

Run these commands in PowerShell:

```powershell
cd c:\Users\sinyo\TradeLine24-7\TradeLine247

# Stage the hero background files
git add src/sections/HeroRoiDuo.tsx
git add src/pages/Index.tsx
git add src/index.css
git add tests/hero-background.spec.ts
git add docs/HERO_BACKGROUND_TESTING_CHECKLIST.md
git add scripts/verify-hero-background.mjs
```

## Step 3: Commit Hero Background Changes

```powershell
git commit -m "fix(ui): restore hero background responsiveness (wallpaper-rollback-20251208)

- Remove background from #app-home div (scoped to hero only)
- Add responsive Tailwind classes to HeroRoiDuo section
- Fix CSS conflict (remove background: transparent override)
- Add comprehensive test suite and verification scripts
- Preserve overlays, gradients, and all hero content"
```

## Step 4: Create Branch and Push

```powershell
# Create branch from current branch
git checkout -b wallpaper-rollback-20251208

# Push to GitHub
git push -u origin wallpaper-rollback-20251208
```

## Step 5: Create PR

After push succeeds, go to:
**https://github.com/Apex-Business-Apps/TradeLine247/compare/main...wallpaper-rollback-20251208**

---

## OR Use the Script (Easier!)

Just run:
```powershell
cd c:\Users\sinyo\TradeLine24-7\TradeLine247
powershell -ExecutionPolicy Bypass -File PUSH_NOW.ps1
```

This will do everything automatically!





