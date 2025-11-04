# Supabase Deployment Workflow Fix

## Problem Identified

The `supabase/deploy` workflow was failing with:
```
Invalid project ref format. Must be like `abcdefghijklmnopqrst`.
```

**Root Cause:**
1. The workflow was triggered on PRs, but PRs from external forks don't have access to repository secrets
2. Environment variables were only set at the step level, not the job level
3. The `SUPABASE_PROJECT_REF` secret wasn't being properly passed to the command

## Solution Applied

### Changes Made:
1. **Added job-level environment variables** - All secrets now set at job level for proper scoping
2. **Added conditional execution** - Workflow only runs on `main` branch pushes, not PRs
3. **Added validation** - Checks if secrets are set before attempting to link
4. **Proper quoting** - Project ref and password are now properly quoted in the command

### Key Fixes:
```yaml
# Only run on main branch pushes, not PRs (PRs don't have secrets in forks)
if: github.event_name == 'push' && github.ref == 'refs/heads/main'

env:
  SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
  SUPABASE_PROJECT_REF: ${{ secrets.SUPABASE_PROJECT_REF }}
  SUPABASE_DB_PASSWORD: ${{ secrets.SUPABASE_DB_PASSWORD }}

# Validation before linking
if [ -z "$SUPABASE_PROJECT_REF" ] || [ -z "$SUPABASE_DB_PASSWORD" ]; then
  echo "Error: SUPABASE_PROJECT_REF or SUPABASE_DB_PASSWORD secrets are not set"
  exit 1
fi
```

## Expected Behavior

- ✅ **PRs**: Workflow will be skipped (no secrets available)
- ✅ **Main branch pushes**: Workflow will run with proper secrets
- ✅ **Validation**: Clear error messages if secrets are missing

## Verification

The project ref `hysvqdwmhxnblxfqnszn` is correctly formatted (20 lowercase letters).
The issue was not the format, but the secret not being accessible in the PR context.

## Next Steps

1. Merge PR #94 to main
2. The workflow will automatically run on the main branch push
3. Deployment should succeed with proper secrets

