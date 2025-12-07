# Git Push Troubleshooting Guide

## Issue
Git commands are executing but output is not visible, making it difficult to diagnose push failures.

## Files That Need to Be Committed

The following files have been modified and need to be committed:

1. ✅ `scripts/production-rubric.mjs` - Created (new file)
2. ✅ `scripts/check-required-files.mjs` - Fixed path resolution
3. ✅ `.github/workflows/ci.yml` - Updated checkout@v4 → checkout@v6
4. ✅ `.github/workflows/ios-build.yml` - Updated checkout@v4 → checkout@v6
5. ✅ `.github/workflows/app-deploy.yml` - Updated checkout@v4 → checkout@v6

## Manual Steps to Push

### Step 1: Check Current Branch
```powershell
git branch --show-current
```

### Step 2: Check Status
```powershell
git status
```

### Step 3: Stage Files
```powershell
git add scripts/production-rubric.mjs
git add scripts/check-required-files.mjs
git add .github/workflows/ci.yml
git add .github/workflows/ios-build.yml
git add .github/workflows/app-deploy.yml
```

### Step 4: Commit
```powershell
git commit -m "Fix build blockers: path resolution and GitHub Actions updates"
```

### Step 5: Create Branch (if needed)
```powershell
git checkout -b fix/build-blockers-20251207
```

### Step 6: Push
```powershell
git push -u origin fix/build-blockers-20251207
```

## Common Issues & Solutions

### Issue: Authentication Required
**Solution:** 
- Use GitHub CLI: `gh auth login`
- Or configure credential helper: `git config --global credential.helper wincred`

### Issue: Branch Already Exists
**Solution:**
```powershell
git push -u origin fix/build-blockers-20251207 --force-with-lease
```

### Issue: No Output from Git Commands
**Solution:**
- Check if files are actually staged: `git diff --cached`
- Verify commits exist: `git log --oneline -5`
- Check remote: `git remote -v`

### Issue: Permission Denied
**Solution:**
- Verify you have push access to the repository
- Check if you're using the correct remote URL
- Ensure you're authenticated with GitHub

## Verification

After pushing, verify on GitHub:
1. Go to: https://github.com/Apex-Business-Apps/TradeLine247
2. Check branches: Should see `fix/build-blockers-20251207`
3. Check commits: Should see the commit message

## Alternative: Use GitHub CLI

If git push fails, try using GitHub CLI:
```powershell
gh repo sync
gh pr create --title "Fix build blockers" --body "Fixes path resolution and updates GitHub Actions"
```
