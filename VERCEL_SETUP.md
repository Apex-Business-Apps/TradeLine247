# Vercel Integration Setup Guide

This guide will help you set up Vercel deployment for TradeLine 24/7.

## 🚀 Quick Setup

### Option 1: GitHub Integration (Recommended)

1. **Connect Repository to Vercel**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New Project"
   - Import `apexbusiness-systems/tradeline247`
   - Vercel will auto-detect Vite configuration

2. **Configure Build Settings**
   - Framework Preset: **Vite**
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `dist` (auto-detected)
   - Install Command: `npm ci` (auto-detected)

3. **Set Environment Variables**
   Go to Project Settings → Environment Variables and add:

   **Required (Public - Safe to expose):**
   ```
   VITE_SUPABASE_URL=https://hysvqdwmhxnblxfqnszn.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

   **Optional (if using analytics):**
   ```
   VITE_KLAVIYO_PUBLIC_KEY=your_key_here
   ```

4. **Deploy**
   - Vercel will automatically deploy on every push to `main`
   - Preview deployments are created for all PRs

### Option 2: GitHub Actions (Current Setup)

The repository already includes a GitHub Actions workflow (`.github/workflows/vercel-deploy.yml`) that deploys to Vercel.

**Required GitHub Secrets:**
1. Go to: https://github.com/apexbusiness-systems/tradeline247/settings/secrets/actions
2. Add the following secrets:

   ```
   VERCEL_TOKEN=your_vercel_token
   VERCEL_ORG_ID=your_org_id
   VERCEL_PROJECT_ID=your_project_id
   ```

**How to get these values:**
1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel login`
3. Run `vercel link` in your project directory
4. This will create `.vercel/project.json` with your IDs
5. Get token from: https://vercel.com/account/tokens

**Deployment:**
- Automatically deploys on push to `main` branch
- Manual trigger available via GitHub Actions UI

## 📋 Environment Variables

### Required Variables

These must be set in Vercel Dashboard → Settings → Environment Variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL | `https://hysvqdwmhxnblxfqnszn.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous/public key | `eyJhbGci...` |

### Optional Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_KLAVIYO_PUBLIC_KEY` | Klaviyo analytics key | No |
| `VITE_APP_NAME` | Application name | No |
| `VITE_APP_URL` | Application URL | No |

## 🔧 Configuration Files

### `vercel.json`
- Configures SPA routing (all routes → `/index.html`)
- Sets security headers
- Configures asset caching
- Framework: Vite (auto-detected)

### `.vercelignore`
- Excludes unnecessary files from deployment
- Reduces deployment size
- Speeds up builds

## 🚦 Deployment Workflow

### Automatic (GitHub Integration)
1. Push to `main` → Production deployment
2. Open PR → Preview deployment
3. Merge PR → Production deployment

### Manual (GitHub Actions)
1. Push to `main` → Triggers workflow
2. Workflow builds and deploys to Vercel
3. Deployment URL output in workflow logs

## 🔍 Verification

After deployment, verify:

1. **Application loads**: Visit your Vercel deployment URL
2. **Routing works**: Navigate to different routes (e.g., `/features`, `/pricing`)
3. **API connections**: Check browser console for Supabase connection
4. **Environment variables**: Verify in Vercel Dashboard → Settings → Environment Variables

## 🐛 Troubleshooting

### Build Fails
- Check build logs in Vercel Dashboard
- Verify all required environment variables are set
- Ensure `package.json` has correct build script

### Routing Issues
- Verify `vercel.json` has correct rewrite rules
- Check that `dist/index.html` exists after build

### Environment Variables Not Working
- Ensure variables are prefixed with `VITE_` for Vite apps
- Check variable names match exactly (case-sensitive)
- Redeploy after adding new variables

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html#vercel)
- [Environment Variables Guide](./ENVIRONMENT_VARIABLES.md)

## 🔐 Security Notes

- **Never commit** `.env` files or secrets
- All `VITE_*` variables are **public** (embedded in client bundle)
- Use Vercel Dashboard for sensitive variables
- Server-side secrets should use Supabase Edge Functions, not Vercel

