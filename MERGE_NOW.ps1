Write-Host "========================================" -ForegroundColor Cyan
Write-Host "MERGING AND PUSHING TO MAIN" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

cd c:\Users\sinyo\TradeLine24-7\TradeLine247

Write-Host "Current branch:" -ForegroundColor Yellow
git branch --show-current
Write-Host ""

Write-Host "Step 1: Checkout main" -ForegroundColor Green
git checkout main
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to checkout main" -ForegroundColor Red
    exit 1
}
Write-Host ""

Write-Host "Step 2: Pull latest main" -ForegroundColor Green
git pull origin main
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to pull main" -ForegroundColor Red
    exit 1
}
Write-Host ""

Write-Host "Step 3: Check if wallpaper-rollback-20251208 exists" -ForegroundColor Green
git branch -a | Select-String "wallpaper"
Write-Host ""

Write-Host "Step 4: Merge wallpaper-rollback-20251208" -ForegroundColor Green
git merge wallpaper-rollback-20251208 --no-edit
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Merge failed" -ForegroundColor Red
    Write-Host "Trying wallpaper-rollback-20251208-clean..." -ForegroundColor Yellow
    git merge wallpaper-rollback-20251208-clean --no-edit
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Both merges failed" -ForegroundColor Red
        exit 1
    }
}
Write-Host ""

Write-Host "Step 5: Push to main" -ForegroundColor Green
git push origin main
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to push" -ForegroundColor Red
    exit 1
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SUCCESS! Latest commit:" -ForegroundColor Green
git log --oneline -1
Write-Host "========================================" -ForegroundColor Cyan




