# Push Instructions for New PR Branch

## Quick Push Command

Run this in PowerShell (replace `YOUR_BRANCH_NAME` with your actual branch name):

```powershell
# 1. Set remote
git remote set-url origin https://github.com/Apex-Business-Apps/TradeLine247.git

# 2. Get your branch name
$branch = git rev-parse --abbrev-ref HEAD
Write-Host "Pushing branch: $branch"

# 3. Stage and commit any uncommitted changes
git add -A
git commit -m "Fix build blockers: path resolution and GitHub Actions updates"

# 4. Push
git push -u origin $branch

# 5. Get PR link
Write-Host "PR Link: https://github.com/Apex-Business-Apps/TradeLine247/compare/main...$branch"
```

## Files Ready to Push

✅ **scripts/production-rubric.mjs** - Created (production readiness validation)
✅ **scripts/check-required-files.mjs** - Fixed (absolute path resolution)
✅ **.github/workflows/ci.yml** - Updated (checkout@v4 → checkout@v6)
✅ **.github/workflows/ios-build.yml** - Updated (checkout@v4 → checkout@v6)
✅ **.github/workflows/app-deploy.yml** - Updated (checkout@v4 → checkout@v6)

## Verification

After pushing, verify:
1. Go to: https://github.com/Apex-Business-Apps/TradeLine247/branches
2. Check if your branch appears
3. Click "New pull request" next to your branch

## Alternative: Use the Script

Run the simplified script:
```powershell
.\push-current-branch.ps1
```

This will:
- Detect your current branch automatically
- Stage and commit any changes
- Push to remote
- Show you the PR link
