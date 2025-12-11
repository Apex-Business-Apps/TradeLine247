@echo off
cd /d c:\Users\sinyo\TradeLine24-7\TradeLine247
echo ========================================
echo MERGING TO MAIN
echo ========================================
echo.

echo Switching to main...
git checkout main
git pull origin main
echo.

echo Merging wallpaper-rollback-20251208-clean...
git merge wallpaper-rollback-20251208-clean --no-edit
echo.

if %ERRORLEVEL% EQU 0 (
    echo Merge successful! Pushing to main...
    git push origin main
    echo.
    echo ========================================
    echo DONE! Changes merged to main
    echo ========================================
) else (
    echo.
    echo ========================================
    echo MERGE FAILED! Error code: %ERRORLEVEL%
    echo ========================================
)

pause





