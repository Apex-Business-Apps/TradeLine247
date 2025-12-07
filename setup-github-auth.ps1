# PowerShell script to set up GitHub authentication
# Run this first if you get authentication errors

Write-Host "GitHub Authentication Setup" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan
Write-Host ""

# Check if GitHub CLI is installed
$ghInstalled = Get-Command gh -ErrorAction SilentlyContinue

if ($ghInstalled) {
    Write-Host "✅ GitHub CLI (gh) is installed" -ForegroundColor Green
    Write-Host ""
    Write-Host "Option 1: Use GitHub CLI (Recommended)" -ForegroundColor Yellow
    Write-Host "  Run: gh auth login" -ForegroundColor White
    Write-Host "  Follow the prompts to authenticate" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host "⚠️  GitHub CLI (gh) is not installed" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Option 1: Install GitHub CLI" -ForegroundColor Yellow
    Write-Host "  Run: winget install --id GitHub.cli" -ForegroundColor White
    Write-Host "  Then: gh auth login" -ForegroundColor White
    Write-Host ""
}

Write-Host "Option 2: Use Personal Access Token (PAT)" -ForegroundColor Yellow
Write-Host "  1. Go to: https://github.com/settings/tokens" -ForegroundColor White
Write-Host "  2. Click 'Generate new token' > 'Generate new token (classic)'" -ForegroundColor White
Write-Host "  3. Name it 'TradeLine247 Push'" -ForegroundColor White
Write-Host "  4. Select scopes: repo (all)" -ForegroundColor White
Write-Host "  5. Generate and copy the token" -ForegroundColor White
Write-Host "  6. Run the command below with your token:" -ForegroundColor White
Write-Host ""
Write-Host "     git remote set-url origin https://YOUR_TOKEN@github.com/Apex-Business-Apps/TradeLine247.git" -ForegroundColor Cyan
Write-Host ""
Write-Host "     OR use it when prompted for password during push" -ForegroundColor Gray
Write-Host ""

Write-Host "Option 3: Use SSH (Most Secure)" -ForegroundColor Yellow
Write-Host "  1. Generate SSH key: ssh-keygen -t ed25519 -C 'your_email@example.com'" -ForegroundColor White
Write-Host "  2. Add to ssh-agent: ssh-add ~/.ssh/id_ed25519" -ForegroundColor White
Write-Host "  3. Copy public key: Get-Content ~/.ssh/id_ed25519.pub | Set-Clipboard" -ForegroundColor White
Write-Host "  4. Add to GitHub: https://github.com/settings/keys" -ForegroundColor White
Write-Host "  5. Change remote URL: git remote set-url origin git@github.com:Apex-Business-Apps/TradeLine247.git" -ForegroundColor White
Write-Host ""

Write-Host "After authentication, run: .\push-to-github.ps1" -ForegroundColor Green


