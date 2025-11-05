# Comprehensive Code Audit & Cleanup Plan

**Date**: 2025-01-XX  
**Branch**: `fix/wcag-aa-optimized-brand-aligned-2025`  
**Status**: ✅ **AUDIT IN PROGRESS**

---

## 📋 Audit Scope

1. **File Structure Audit** - Identify unused/deprecated files
2. **Code Quality Audit** - Remove console logs, fix TODOs
3. **Import Optimization** - Remove unused imports
4. **Documentation Cleanup** - Organize/archive historical docs
5. **Code Refactoring** - Streamline without breaking changes

---

## 🔍 Phase 1: File Structure Audit

### A. Temporary/Generated Files (SAFE TO DELETE)

**Status**: ✅ **VERIFIED - Safe to Delete**

1. `pr_body.txt` - Temporary PR body file (historical)
2. `commit-message.txt` - Temporary commit message (historical)
3. `ci-fix-commit-message.txt` - Temporary CI fix message (historical)
4. `CI_FIX_COMMIT_MESSAGE.txt` - Temporary CI fix message (historical)
5. `CI_PERMANENT_FIX_COMMIT.txt` - Temporary commit message (historical)
6. `QUICK_WINS_PR_MESSAGE.txt` - Temporary PR message (historical)

**Action**: ✅ Delete after verification

---

### B. Documentation Files (ARCHIVE/ORGANIZE)

**Status**: ⚠️ **REVIEW BEFORE DELETION**

**Current Documentation Files**: 179+ .md files in root

**Categories**:
1. **Current/Active** (Keep):
   - `README.md` - Main project documentation
   - `CHANGELOG.md` - Project changelog
   - `SECURITY.md` - Security documentation
   - `SUPPORT.md` - Support documentation
   - `package-scripts.md` - Script documentation
   - `docs/` directory - Active documentation

2. **Historical/Completed** (Archive or Move to `docs/archive/`):
   - All `*_COMPLETE.md` files
   - All `*_SUMMARY.md` files (except current ones)
   - All `*_FIXES.md` files (historical)
   - All `*_AUDIT.md` files (historical)
   - All `*_STATUS.md` files (historical)

3. **PR Documentation** (Keep only current):
   - `OPTIMIZED_PR_BODY.md` - Current PR (keep)
   - `CRITICAL_FIXES_PR_BODY.md` - Historical (archive)
   - `PR_FINAL_ENTERPRISE_GRADE.md` - Historical (archive)
   - `pr_body.md` - Historical (archive)

**Action**: ⚠️ Create `docs/archive/` and move historical docs

---

### C. Code Files Audit

#### 1. Legacy Hooks (KEEP - Backward Compatibility)

**Status**: ✅ **KEEP** - Still in use

- `src/hooks/useDashboardData.ts` - Legacy wrapper, still used in:
  - `src/pages/ClientDashboard.tsx`
  - `src/components/dashboard/NewDashboard.tsx`

**Action**: ✅ Keep for backward compatibility

---

#### 2. Console Logs (CLEANUP)

**Status**: ⚠️ **NEEDS CLEANUP**

**Found**: 227 console.log/warn/error statements

**Categories**:
1. **Development/Debug Logs** (Remove or convert to proper logging):
   - `src/main.tsx` - Startup logs (keep in dev, remove in prod)
   - `src/lib/lovableSaveFailsafe.ts` - Debug logs (convert to proper logging)
   - `src/components/dashboard/PersonalizedTips.tsx` - Debug log

2. **Error Logging** (Keep but improve):
   - `src/hooks/useSafeNavigation.ts` - Error logging (keep)
   - `src/utils/errorObservability.ts` - Error capture (keep)
   - `src/lib/errorReporter.ts` - Error reporting (keep)

3. **Warning Logs** (Keep for debugging):
   - Navigation warnings
   - Auth warnings
   - Health check warnings

**Action**: ⚠️ Create proper logging utility, replace console.log in production

---

#### 3. TODO Comments (ADDRESS)

**Status**: ⚠️ **REVIEW**

**Found**: 1 TODO comment

1. `src/components/dashboard/InviteStaffDialog.tsx:46`
   - `// TODO: Implement actual invitation logic with your backend`
   - **Status**: Needs implementation or removal

**Action**: ⚠️ Address or remove TODO

---

## 🔧 Phase 2: Code Quality Improvements

### A. Remove Console Logs in Production

**Strategy**:
1. Create `src/lib/logger.ts` utility
2. Replace `console.log` with `logger.debug()` (dev only)
3. Replace `console.error` with `logger.error()` (always)
4. Replace `console.warn` with `logger.warn()` (always)

**Files to Update**: ~30 files with debug console.logs

---

### B. Optimize Imports

**Strategy**:
1. Check for unused imports
2. Consolidate duplicate imports
3. Use absolute imports consistently

**Action**: Run ESLint auto-fix for imports

---

### C. Code Refactoring (Safe Improvements)

**Opportunities**:
1. Consolidate duplicate utility functions
2. Extract common patterns
3. Improve type safety
4. Add JSDoc comments

**Action**: ⚠️ Review carefully, test after each change

---

## 📁 Phase 3: File Organization

### A. Create Archive Structure

```
docs/
  archive/
    fixes/
      - All *_FIXES.md files
    audits/
      - All *_AUDIT.md files
    summaries/
      - All *_SUMMARY.md files (historical)
    status/
      - All *_STATUS.md files (historical)
```

### B. Move Historical Documentation

**Action**: Move historical docs to archive, keep only current/relevant

---

## ✅ Phase 4: Verification

### A. Build Verification
- ✅ Run `npm run build`
- ✅ Run `npm run typecheck`
- ✅ Run `npm run lint`

### B. Test Verification
- ✅ Run `npm run test`
- ✅ Verify no regressions

### C. Functionality Verification
- ✅ Verify all imports work
- ✅ Verify no broken components
- ✅ Verify no missing files

---

## 🎯 Cleanup Priority

### Priority 1: Safe Deletions (Immediate)
1. ✅ Delete temporary .txt files
2. ✅ Remove console.log in production code (replace with logger)

### Priority 2: Organization (Medium)
1. ⚠️ Archive historical documentation
2. ⚠️ Address TODO comments

### Priority 3: Refactoring (Low)
1. ⚠️ Optimize imports
2. ⚠️ Code improvements (with testing)

---

## ⚠️ Safety Rules

1. **NEVER DELETE** without verification
2. **ALWAYS TEST** after each change
3. **BACKUP** before major deletions
4. **COMMIT** after each safe change
5. **VERIFY** build and tests after each phase

---

**Next Steps**: Begin Phase 1 cleanup with temporary files

