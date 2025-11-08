# Supabase Secrets Setup Guide

## Quick Setup for GitHub Actions

The Supabase deployment workflow requires three secrets to be configured in your GitHub repository.

### Required Secrets

1. **SUPABASE_PROJECT_REF** - Your Supabase project reference ID
2. **SUPABASE_DB_PASSWORD** - Your Supabase database password
3. **SUPABASE_ACCESS_TOKEN** - Your Supabase access token

### Step-by-Step Setup

#### 1. Navigate to Repository Secrets
Go to: `https://github.com/apexbusiness-systems/tradeline247aicom/settings/secrets/actions`

#### 2. Add SUPABASE_PROJECT_REF
- Click **"New repository secret"**
- Name: `SUPABASE_PROJECT_REF`
- Value: `hysvqdwmhxnblxfqnszn`
- Click **"Add secret"**

#### 3. Add SUPABASE_DB_PASSWORD
- Click **"New repository secret"**
- Name: `SUPABASE_DB_PASSWORD`
- Value: Your Supabase database password (from project settings)
- Click **"Add secret"**

#### 4. Add SUPABASE_ACCESS_TOKEN
- Click **"New repository secret"**
- Name: `SUPABASE_ACCESS_TOKEN`
- Value: Generate a new token at: https://supabase.com/dashboard/account/tokens
- Click **"Add secret"**

### Verification

After adding all secrets:
1. The next push to `main` branch will trigger the deployment workflow
2. The workflow will validate all secrets are present
3. If any secret is missing, you'll see clear error messages with direct links

### Project Reference

The project reference ID `hysvqdwmhxnblxfqnszn` is embedded in:
- `src/config/supabase.ts`
- This is your Supabase project's unique identifier

### Troubleshooting

**Error: "SUPABASE_PROJECT_REF secret is not set"**
- Verify the secret name matches exactly (case-sensitive)
- Ensure the value is `hysvqdwmhxnblxfqnszn`

**Error: "SUPABASE_DB_PASSWORD secret is not set"**
- Retrieve your database password from Supabase project settings
- Ensure there are no extra spaces or quotes in the value

**Error: "SUPABASE_ACCESS_TOKEN secret is not set"**
- Generate a new access token at: https://supabase.com/dashboard/account/tokens
- Ensure the token has not expired

### Security Notes

- These secrets are only accessible to workflows running on the `main` branch
- PRs from forks cannot access these secrets (by design)
- Secrets are encrypted and never exposed in logs

