# Migration Strategy: Local File Dependency → Official NPM Package

## Overview
Migrate from local `@axe-core/playwright` file dependency to official `@axe-core/playwright` npm package to eliminate bun cache corruption issues.

## Current State
- **Local Package**: `tests/e2e/vendor/axe-core-playwright/`
- **Dependency**: `"@axe-core/playwright": "file:tests/e2e/vendor/axe-core-playwright"`
- **Issues**: Bun cache corruption with ENOENT errors

## Target State
- **Official Package**: `@axe-core/playwright@4.11.0`
- **Dependency**: `"@axe-core/playwright": "^4.11.0"`
- **Benefits**: No cache corruption, official maintenance, regular updates

## Migration Steps

### Phase 1: Preparation
1. ✅ **API Compatibility Verified**: Local implementation matches official API
2. ✅ **Usage Analysis Complete**: Tests use `new AxeBuilder({ page }).analyze()` and `.disableRules()`
3. ✅ **Backup Created**: Local package preserved for rollback

### Phase 2: Migration Execution
1. **Remove local dependency** from package.json
2. **Install official package** via npm/bun
3. **Update lock files** and verify installation
4. **Test functionality** across all usage points

### Phase 3: Validation
1. **Unit Tests**: Run accessibility tests
2. **Integration Tests**: Verify CI/CD pipeline
3. **Cache Testing**: Confirm no corruption issues

### Phase 4: Cleanup
1. **Remove local package** directory (after successful validation)
2. **Update documentation** to reflect new dependency
3. **Remove migration-specific scripts** (optional)

## Rollback Plan
If issues arise:
```bash
# Restore local dependency
npm install
git checkout HEAD~1 -- package.json
bun install

# Revert directory removal if needed
git checkout HEAD~1 -- tests/e2e/vendor/
```

## Risk Assessment
- **Low Risk**: API compatibility confirmed, usage patterns identical
- **Backup Available**: Local package can be restored instantly
- **Testing Coverage**: Comprehensive test suite validates functionality

## Success Criteria
- ✅ All accessibility tests pass
- ✅ No bun cache corruption errors
- ✅ CI/CD pipeline functions correctly
- ✅ Package updates work normally

