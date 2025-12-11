# PowerShell script to push to GitHub
# Run this from the project root directory

$repoUrl = "https://github.com/Apex-Business-Apps/TradeLine247.git"
$branchName = "feat/footer-logo-updates"

Write-Host "Setting up git remote..." -ForegroundColor Cyan

# Check if remote exists, if not add it
$remoteExists = git remote get-url origin 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Adding remote origin..." -ForegroundColor Yellow
    git remote add origin $repoUrl
} else {
    Write-Host "Updating remote origin URL..." -ForegroundColor Yellow
    git remote set-url origin $repoUrl
}

Write-Host "`nCurrent branch:" -ForegroundColor Cyan
git branch --show-current

Write-Host "`nChecking git status..." -ForegroundColor Cyan
git status --short

Write-Host "`nStaging all changes..." -ForegroundColor Cyan
git add -A

Write-Host "`nCommitting changes..." -ForegroundColor Cyan
git commit -m "feat: Update footer logos - APEX and Alberta Innovates" -m "- Add APEX logo next to Apex Business Systems text" -m "- Replace broken Alberta Innovates logo with new PNG" -m "- Remove TradeLine logo from footer middle section" -m "- Improve trust badges visual hierarchy and spacing"

Write-Host "`nPushing to GitHub..." -ForegroundColor Cyan
git push -u origin $branchName

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Successfully pushed to GitHub!" -ForegroundColor Green
    Write-Host "`nPR Creation Link:" -ForegroundColor Cyan
    Write-Host "https://github.com/Apex-Business-Apps/TradeLine247/compare/main...$branchName" -ForegroundColor Yellow
} else {
    Write-Host "`n❌ Push failed. Authentication required." -ForegroundColor Red
    Write-Host ""
    Write-Host "Run the authentication setup script:" -ForegroundColor Yellow
    Write-Host "  .\setup-github-auth.ps1" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Quick options:" -ForegroundColor Yellow
    Write-Host "  1. GitHub CLI: gh auth login" -ForegroundColor White
    Write-Host "  2. Personal Access Token: https://github.com/settings/tokens" -ForegroundColor White
    Write-Host "     (Use token as password when prompted)" -ForegroundColor Gray
}








