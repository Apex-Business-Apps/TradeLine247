@echo off
echo ========================================
echo FINAL PUSH AND MERGE
echo ========================================
cd /d c:\Users\sinyo\TradeLine24-7\TradeLine247

echo.
echo Step 1: Checkout main
git checkout main
git pull origin main

echo.
echo Step 2: Merge wallpaper branch
git merge wallpaper-rollback-20251208-clean --no-edit

echo.
echo Step 3: Push to main
git push origin main

echo.
echo ========================================
echo DONE!
echo ========================================
pause





