@echo off
cd /d c:\Users\sinyo\TradeLine24-7\TradeLine247
echo ========================================
echo PUSHING wallpaper-rollback-20251208
echo ========================================
echo.

echo Current branch:
git branch --show-current
echo.

echo Checking out branch...
git checkout wallpaper-rollback-20251208
echo.

echo Pushing to GitHub...
git push -u origin wallpaper-rollback-20251208
echo.

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo SUCCESS! Branch pushed!
    echo ========================================
    echo.
    echo Create PR at:
    echo https://github.com/Apex-Business-Apps/TradeLine247/compare/main...wallpaper-rollback-20251208
) else (
    echo.
    echo ========================================
    echo PUSH FAILED! Error code: %ERRORLEVEL%
    echo ========================================
    echo.
    echo You may need to authenticate with GitHub.
    echo Try: gh auth login
)

pause




