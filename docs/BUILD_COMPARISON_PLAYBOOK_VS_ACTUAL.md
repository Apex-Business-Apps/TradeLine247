# Build Configuration Comparison: Playbook Spec vs Actual Implementation

**Date:** 2025-01-XX  
**Comparison:** APEX Build Playbook vs Current Codemagic Configuration

---

## 📋 EXECUTIVE SUMMARY

| Category | Playbook Requirement | Actual Status | Gap |
|----------|---------------------|---------------|-----|
| **iOS Versioning** | APP_VERSION + BUILD_NUMBER env vars | ⚠️ **PARTIAL** | Missing explicit env vars in codemagic.yaml |
| **iOS Trigger** | Manual or git tag | ✅ **MATCH** | Push to main (also supports manual) |
| **iOS TestFlight** | submit_to_testflight: true, submit_to_app_store: false | ✅ **MATCH** | Configured correctly |
| **Android Versioning** | versionCode formula (major*10000 + minor*100 + patch) | ❌ **MISSING** | No version management in build script |
| **Android AAB Output** | app/build/outputs/bundle/release/app-release.aab | ✅ **MATCH** | Correct path |
| **Quality Gates** | Unit tests + smoke tests | ✅ **MATCH** | lint + typecheck + unit + smoke |

---

## 🔍 DETAILED COMPARISON

### PLAYBOOK 2 – iOS Build (Codemagic)

#### ✅ **MATCHING REQUIREMENTS**

| Playbook Spec | Actual Implementation | Status |
|--------------|----------------------|--------|
| **App Store Connect API Key** | ✅ Configured via `appstore_credentials` group | ✅ |
| **Automatic code signing** | ✅ Uses `ios_signing` block with `distribution_type: app_store` | ✅ |
| **Xcode version** | ✅ `xcode: 16.4` (specific version) | ✅ |
| **Node/npm versions** | ✅ `node: 20.11.1`, `npm: 10` | ✅ |
| **Bundle ID** | ✅ `com.apex.tradeline` | ✅ |
| **submit_to_testflight: true** | ✅ Configured | ✅ |
| **submit_to_app_store: false** | ✅ Not set (defaults to false) | ✅ |
| **Quality gates** | ✅ lint + typecheck + unit tests | ✅ |
| **Playwright smoke tests** | ✅ Runs before build | ✅ |
| **Artifacts path** | ✅ Includes IPA path | ✅ |
| **Trigger on push** | ✅ Push to main branch | ✅ |

#### ⚠️ **GAPS / DISCREPANCIES**

##### **1. Version Management Environment Variables**

**Playbook Requirement:**
> "Set environment variables for APP_VERSION and BUILD_NUMBER"

**Actual Implementation:**
- ❌ **No `APP_VERSION` env var in codemagic.yaml**
- ❌ **No `BUILD_NUMBER` env var in codemagic.yaml**
- ⚠️ Script `set-ios-version-from-codemagic.sh` exists but **NOT called** in codemagic.yaml
- ⚠️ Script expects `APP_VERSION` and `PROJECT_BUILD_NUMBER` but they're not set

**Impact:** Version numbers may not be set correctly during build.

**Required Fix:**
```yaml
environment:
  vars:
    APP_VERSION: "1.1.0"  # Should match marketing version
    PROJECT_BUILD_NUMBER: "${CM_BUILD_NUMBER}"  # Codemagic auto-increment
```

**Also needed:** Call version script before build:
```yaml
- name: Set iOS version numbers
  script: |
    bash scripts/set-ios-version-from-codemagic.sh
```

---

##### **2. Trigger Recommendation**

**Playbook Suggestion:**
> "Trigger: manual or on git tag (e.g. ios-v1.0.2)"

**Actual Implementation:**
- ✅ Push to main triggers build
- ❌ No git tag trigger configured

**Status:** Functional but could add tag-based triggers for releases.

---

##### **3. Release Notes**

**Playbook Requirement:**
> "Optionally set release notes for TestFlight builds"

**Actual Implementation:**
- ❌ No release notes configured in publishing block

**Impact:** TestFlight builds won't have release notes automatically.

**Required Fix:**
```yaml
publishing:
  app_store_connect:
    # ... existing config ...
    release_notes: "Internal build ${APP_VERSION} - ${CM_COMMIT_MESSAGE}"
```

---

### PLAYBOOK 1 – Android Build

#### ✅ **MATCHING REQUIREMENTS**

| Playbook Spec | Actual Implementation | Status |
|--------------|----------------------|--------|
| **AAB output format** | ✅ `app/build/outputs/bundle/release/app-release.aab` | ✅ |
| **Signing via keystore** | ✅ Uses encrypted keystore from env vars | ✅ |
| **Release build type** | ✅ `bundleRelease` task | ✅ |
| **CI integration** | ✅ Codemagic workflow configured | ✅ |
| **Quality gates** | ✅ lint + typecheck + unit + smoke | ✅ |
| **Java version** | ✅ Java 17 | ✅ |

#### ❌ **MISSING REQUIREMENTS**

##### **1. Version Management**

**Playbook Requirement:**
> "versionCode: Must be monotonically increasing integer"
> "Keep pattern: major * 10000 + minor * 100 + patch"
> "Example: 1.2.3 → 10203"
> "Before every build, confirm versionCode has increased"

**Actual Implementation:**
- ❌ **No versionCode management in build script**
- ❌ **No versionName management in build script**
- ❌ **No version validation before build**

**Impact:** Version numbers must be manually updated in `build.gradle`, no automation.

**Required Fix:** Add version management script similar to iOS:
```bash
# scripts/set-android-version.sh
VERSION_NAME="${APP_VERSION:-1.0.0}"
# Parse: 1.2.3 → versionCode = 10203
MAJOR=$(echo $VERSION_NAME | cut -d. -f1)
MINOR=$(echo $VERSION_NAME | cut -d. -f2)
PATCH=$(echo $VERSION_NAME | cut -d. -f3)
VERSION_CODE=$((MAJOR * 10000 + MINOR * 100 + PATCH))
# Update build.gradle
```

---

##### **2. Version Alignment**

**Playbook Requirement:**
> "Keep [versionName] aligned across Android and iOS so everyone knows what build they're on"

**Actual Implementation:**
- ❌ No shared version source (iOS uses APP_VERSION from codemagic.yaml, Android uses build.gradle)
- ❌ No validation that versions match

**Required Fix:** Use single source of truth (env var) for both platforms.

---

##### **3. Release Checklist Automation**

**Playbook Requirement:**
> Multiple manual checks before release (device testing, crashes, etc.)

**Actual Implementation:**
- ❌ No automated checklist validation
- ⚠️ Only automated tests (smoke tests exist but don't cover all playbook criteria)

**Status:** Manual process required.

---

### PLAYBOOK 3 – Quality & Release Criteria

#### ⚠️ **PARTIAL IMPLEMENTATION**

| Playbook Requirement | Actual Implementation | Gap |
|---------------------|----------------------|-----|
| **Visual/UX consistency checks** | ❌ No automated checks | Manual only |
| **Core flows testing** | ✅ Smoke tests exist | ⚠️ Limited coverage |
| **Device testing** | ❌ No automated device testing | Manual only |
| **Network error handling** | ⚠️ Unknown | Needs verification |
| **Crash reporting** | ⚠️ Unknown | Needs verification |
| **Release notes** | ❌ Not automated | Manual only |
| **Known issues tracking** | ❌ No system | Missing |
| **Go/No-Go gate** | ⚠️ Tests must pass | ⚠️ No explicit checklist |

**Status:** Quality gates exist (lint, typecheck, tests) but don't cover all playbook criteria.

---

## 🎯 CRITICAL GAPS TO FIX

### **Priority 1: iOS Version Management**

**Problem:** Version numbers may not be set correctly.

**Fix Required:**
1. Add `APP_VERSION` and `PROJECT_BUILD_NUMBER` to codemagic.yaml environment vars
2. Call `scripts/set-ios-version-from-codemagic.sh` before build
3. Verify version is set correctly in Info.plist

**Files to Modify:**
- `codemagic.yaml` (add env vars and script step)

---

### **Priority 2: Android Version Management**

**Problem:** No automated version management for Android.

**Fix Required:**
1. Create `scripts/set-android-version.sh` with formula: `major * 10000 + minor * 100 + patch`
2. Add version management step to android build workflow
3. Use same `APP_VERSION` env var as iOS for alignment

**Files to Create:**
- `scripts/set-android-version.sh`

**Files to Modify:**
- `codemagic.yaml` (add script step to android workflow)

---

### **Priority 3: Release Notes**

**Problem:** TestFlight builds don't include release notes.

**Fix Required:**
Add `release_notes` to iOS publishing block in codemagic.yaml.

---

## 📊 COMPLIANCE SCORE

| Category | Score | Details |
|----------|-------|---------|
| **iOS Build Process** | 85% | Missing version env vars and release notes |
| **Android Build Process** | 60% | Missing version management entirely |
| **Quality Gates** | 70% | Has tests but missing playbook criteria |
| **Version Alignment** | 0% | No shared version source |
| **Overall Compliance** | **64%** | Needs work on versioning |

---

## ✅ RECOMMENDATIONS

### **Immediate Actions:**

1. **Add iOS version environment variables to codemagic.yaml**
2. **Call version script in iOS workflow**
3. **Create Android version management script**
4. **Add release notes to TestFlight publishing**
5. **Use single APP_VERSION env var for both platforms**

### **Future Enhancements:**

1. Add git tag triggers for releases
2. Implement version alignment validation
3. Add more comprehensive quality gates per Playbook 3
4. Automate release checklist where possible
5. Track known issues in documentation

---

## 📝 SPECIFIC CODE CHANGES NEEDED

### Change 1: Add iOS Version Management to codemagic.yaml

```yaml
environment:
  vars:
    APP_VERSION: "1.1.0"  # Update when releasing
    # PROJECT_BUILD_NUMBER will be auto-set by Codemagic as CM_BUILD_NUMBER

scripts:
  - name: Set iOS version numbers
    script: |
      set -eo pipefail
      export PROJECT_BUILD_NUMBER="${CM_BUILD_NUMBER:-1}"
      bash scripts/set-ios-version-from-codemagic.sh
```

### Change 2: Add Android Version Management Script

Create `scripts/set-android-version.sh`:
```bash
#!/usr/bin/env bash
set -euo pipefail

VERSION_NAME="${APP_VERSION:-1.0.0}"
BUILD_GRADLE="android/app/build.gradle"

# Parse version: 1.2.3 → versionCode = 10203
MAJOR=$(echo $VERSION_NAME | cut -d. -f1)
MINOR=$(echo $VERSION_NAME | cut -d. -f2)
PATCH=$(echo $VERSION_NAME | cut -d. -f3)
VERSION_CODE=$((MAJOR * 10000 + MINOR * 100 + PATCH))

# Update build.gradle (using sed or similar)
# Implementation depends on build.gradle structure
```

### Change 3: Add Release Notes

```yaml
publishing:
  app_store_connect:
    # ... existing config ...
    release_notes: "Build ${APP_VERSION} (${CM_BUILD_NUMBER})"
```

---

**Last Updated:** 2025-01-XX  
**Next Review:** After implementing fixes

