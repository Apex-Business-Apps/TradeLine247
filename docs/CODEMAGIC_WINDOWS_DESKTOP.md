# Codemagic Windows Desktop Build Guide

## 🎯 Overview

This repository is configured for **Windows Desktop** builds using Codemagic's Windows instances. The web bundle created can be packaged for Windows distribution via:

- **PWABuilder** (Recommended) - Creates MSIX packages for Microsoft Store
- **Electron** - Standalone desktop application
- **Direct web deployment** - Progressive Web App

---

## 🏗️ Current Workflow Configuration

### ✅ Active Workflows

| Workflow | Platform | Instance | Status |
|----------|----------|----------|--------|
| `windows-desktop-pwa` | Windows | `windows_x2` | ✅ **PRIMARY** |
| `web-tests-only` | Linux | `linux` | ✅ CI/CD |
| `android-capacitor-release` | Android | `linux_x2` | ✅ Optional |

### ⏸️ Disabled Workflows

| Workflow | Reason | To Enable |
|----------|--------|-----------|
| `ios-capacitor-testflight` | No Mac instance + `BUNDLE_ID` in wrong group | Move `BUNDLE_ID` to `ios_appstore` group |

---

## 🚀 Triggering Windows Builds

### Automatic Triggers

Builds trigger automatically on:
- **Push to `main` branch**
- **Push to `fix/**` branches**
- **Push to `feature/**` branches**

### Manual Trigger

1. Go to Codemagic UI
2. Select `windows-desktop-pwa` workflow
3. Click "Start new build"
4. Select branch: `main` or your feature branch

---

## 📦 Build Artifacts

After successful build, the following artifacts are available:

```
dist/
├── index.html                 # Entry point
├── assets/                    # JS/CSS bundles
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── vendor-[hash].js
├── manifest.json              # PWA manifest
├── sw.js                      # Service worker
└── build-info.json            # Build metadata (NEW)
```

### Build Metadata (`dist/build-info.json`)

```json
{
  "platform": "windows",
  "buildDate": "2025-11-20 15:30:00",
  "commitHash": "3e06f6e",
  "nodeVersion": "v20.11.1",
  "npmVersion": "10.5.0"
}
```

---

## 🔧 Local Windows Build

### Prerequisites

- **Node.js**: 20.x or higher
- **npm**: 10.x or higher
- **PowerShell**: 5.1+ or PowerShell Core 7+

### Build Commands

```powershell
# Full build with tests
npm run build:web

# Using custom Windows script
.\scripts\build-windows.ps1

# Skip tests (faster)
.\scripts\build-windows.ps1 -SkipTests

# Verbose output
.\scripts\build-windows.ps1 -Verbose
```

---

## 📱 Packaging for Windows Distribution

### Option 1: PWABuilder (Recommended)

**Best for:** Microsoft Store distribution

```powershell
# 1. Build production bundle
npm run build:web

# 2. Navigate to PWABuilder
# https://www.pwabuilder.com/

# 3. Enter your production URL
# Example: https://tradeline247.com

# 4. Select "Windows" platform

# 5. Configure package:
#    - Package ID: com.apex.tradeline
#    - Publisher: CN=[Your Publisher]
#    - Version: 1.0.0.0

# 6. Download .msixbundle

# 7. Sign package (if needed)
signtool sign /fd SHA256 /a /f cert.pfx /p password TradeLine247.msixbundle
```

### Option 2: Electron Wrapper

**Best for:** Standalone desktop app (no store)

```powershell
# Install Electron globally
npm install -g electron

# Package with electron-builder
npm install --save-dev electron electron-builder

# Create electron config (package.json)
{
  "main": "electron.js",
  "build": {
    "appId": "com.apex.tradeline",
    "win": {
      "target": ["nsis", "portable"],
      "icon": "public/icons/icon-512x512.png"
    }
  }
}

# Build
npm run electron:build
```

### Option 3: Direct Web Deployment

**Best for:** PWA (no packaging needed)

```powershell
# Deploy dist/ folder to:
- Azure Static Web Apps
- Vercel
- Netlify
- IIS Server

# Users access via browser:
https://yourdomain.com
```

---

## 🔍 Troubleshooting

### Build Fails on Windows Instance

**Error:** `npm ci failed`

```powershell
# Solution: Clear npm cache
npm cache clean --force
```

**Error:** `dist/index.html not found`

```powershell
# Solution: Check Vite config
# Ensure webDir matches: dist/
```

### BUNDLE_ID Error (iOS)

**Error:** `BUNDLE_ID not accessible via groups`

**Cause:** `BUNDLE_ID` exists in `ios_config` group but workflow references `ios_appstore`

**Solution:** iOS workflow has been removed (Windows Desktop focus). To re-enable:

1. In Codemagic UI, move `BUNDLE_ID` variable:
   - FROM: `ios_config` group
   - TO: `ios_appstore` group
2. Restore iOS workflow from git history
3. Ensure Mac instance is available

---

## 📊 Build Performance

| Stage | Duration | Can Skip? |
|-------|----------|-----------|
| Dependencies | ~2 min | No |
| Lint + Typecheck | ~1 min | Yes (with `--SkipTests`) |
| Unit Tests | ~30 sec | Yes |
| Playwright Smoke | ~2 min | No |
| Production Build | ~3 min | No |
| **Total** | **~8 min** | - |

---

## 🎯 Next Steps

1. ✅ **Windows build working** - Primary workflow active
2. ⏳ **Package with PWABuilder** - Create MSIX for store
3. ⏳ **Submit to Microsoft Store** - Distribution
4. 🔮 **Future:** Re-enable iOS when Mac available

---

## 🆘 Support

- **Codemagic Docs:** https://docs.codemagic.io/yaml-basic-configuration/yaml-getting-started/
- **PWABuilder:** https://www.pwabuilder.com/
- **Microsoft Store:** https://partner.microsoft.com/dashboard

---

**Last Updated:** November 20, 2025  
**Workflow Version:** 2.0 (Windows Desktop Focus)

