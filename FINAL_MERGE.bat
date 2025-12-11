@echo off
echo ========================================
echo FINAL MERGE AND PUSH TO MAIN
echo ========================================
cd /d c:\Users\sinyo\TradeLine24-7\TradeLine247

echo.
echo Current branch:
git branch --show-current

echo.
echo Step 1: Checkout main
git checkout main
if errorlevel 1 (
    echo ERROR: Failed to checkout main
    pause
    exit /b 1
)

echo.
echo Step 2: Pull latest main
git pull origin main
if errorlevel 1 (
    echo ERROR: Failed to pull main
    pause
    exit /b 1
)

echo.
echo Step 3: Merge wallpaper-rollback-20251208
git merge wallpaper-rollback-20251208 --no-edit
if errorlevel 1 (
    echo Merge failed, checking if already merged...
    git log --oneline --grep="wallpaper" -1
    if errorlevel 1 (
        echo ERROR: Merge failed and not found in history
        pause
        exit /b 1
    ) else (
        echo Already merged!
    )
)

echo.
echo Step 4: Push to main
git push origin main
if errorlevel 1 (
    echo ERROR: Failed to push
    pause
    exit /b 1
)

echo.
echo ========================================
echo SUCCESS! Latest commit:
git log --oneline -1
echo ========================================
echo.
echo Verify on GitHub:
echo https://github.com/Apex-Business-Apps/TradeLine247/blob/main/src/sections/HeroRoiDuo.tsx
echo ========================================
pause





