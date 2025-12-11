# Database Migration Setup Guide

## Required GitHub Secrets

The `db-migrate.yml` workflow requires one of the following configurations:

### Option 1: Using Supabase Link (Recommended)

Set these secrets in GitHub Actions:
- `SUPABASE_PROJECT_REF` - Your Supabase project reference (e.g., `hysvqdwmhxnblxfqnszn`)
- `SUPABASE_DB_PASSWORD` - Your Supabase database password
- `SUPABASE_ACCESS_TOKEN` - Your Supabase access token (optional, for authentication)

### Option 2: Using Direct Database URL

Set this secret in GitHub Actions:
- `SUPABASE_DB_URL` - Full PostgreSQL connection string:
  ```
  postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
  ```

## How to Set Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret with its value

## Finding Your Project Reference

From your Supabase URL: `https://hysvqdwmhxnblxfqnszn.supabase.co`

Your project reference is: `hysvqdwmhxnblxfqnszn`

## Finding Your Database Password

1. Go to Supabase Dashboard
2. Navigate to **Settings** → **Database**
3. Find your database password (or reset it if needed)

## Testing the Migration

After setting secrets, you can test the migration workflow:

1. Go to **Actions** tab in GitHub
2. Select **db/migrate** workflow
3. Click **Run workflow**
4. Select the branch (usually `main`)
5. Click **Run workflow**

## Troubleshooting

### Error: "Missing SUPABASE_DB_URL"

This means neither the link method nor DB URL method is configured. Set up one of the options above.

### Error: "Link failed"

Check that:
- `SUPABASE_PROJECT_REF` is correct
- `SUPABASE_DB_PASSWORD` is correct
- `SUPABASE_ACCESS_TOKEN` is set (if required)

### Migration Fails

Check the workflow logs for specific SQL errors. Common issues:
- Migration syntax errors
- Permission issues
- Database connection problems

