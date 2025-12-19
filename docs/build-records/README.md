# GOODBUILD Records Index

This directory contains official GOODBUILD records documenting verified green builds from our CI/CD pipeline. Each record represents a known-good build snapshot that can be referenced for rollback, verification, or deployment decisions.

## Purpose

GOODBUILD records serve as:
- **Stable baselines** for rollback decisions
- **Verification checkpoints** for deployment confidence
- **Historical documentation** of successful build configurations
- **Reference points** for troubleshooting build issues

## Build Records

| Date | Label | Commit | Workflow | Build Index/ID | Status |
|------|-------|--------|----------|----------------|--------|
| 2025-12-19 | `GOODBUILD-2025-12-19-1e15622` | `1e156221` | iOS TestFlight | #113 (`6945001c434a30f77794bc23`) | ✅ Green |
| 2025-12-15 | `GOODBUILD-2025-12-15-4e01370` | `7911eb28` | Local Build | N/A | ✅ Passed |

## Record Format

Each GOODBUILD record includes:
- **Overview** - Purpose and why this build matters
- **Source of Truth** - Commit hash, build ID, workflow details
- **Build Snapshot** - Metadata, configuration, artifacts
- **Verification** - Automated and manual verification steps
- **Manual Verification Checklist** - Step-by-step operator actions
- **Risks / Notes** - Known issues or important considerations
- **Next Actions** - Follow-up tasks or recommendations

## Usage

### Finding a Build Record
```bash
# List all GOODBUILD records
ls docs/build-records/GOODBUILD-*.md

# View a specific record
cat docs/build-records/GOODBUILD-2025-12-19-1e15622.md
```

### Referencing in Documentation
When referencing a GOODBUILD in other docs, use the label format:
```
See GOODBUILD-2025-12-19-1e15622 for verified iOS TestFlight baseline.
```

### Rollback Decision
To rollback to a known-good build:
```bash
# Checkout the commit from the GOODBUILD record
git checkout <commit-hash>

# Or use the tag (if created)
git checkout GOODBUILD-2025-12-19-1e15622
```

---

**Last Updated:** 2025-12-19  
**Maintained By:** DevOps Team
