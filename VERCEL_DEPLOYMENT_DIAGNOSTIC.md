# Vercel Auto-Deployment Diagnostic & Fix

## 🔍 Problem
Vercel is **NOT** automatically deploying when code is pushed to GitHub `main` branch.

## 📋 Root Causes (Common Issues)

### 1. **GitHub Integration Not Connected**
- Vercel project not linked to GitHub repository
- Integration was disconnected or revoked
- OAuth token expired

### 2. **Branch Filtering**
- Vercel only configured to deploy from specific branches
- `main` branch not included in deployment branches
- Production branch configured incorrectly

### 3. **Build Settings Mismatch**
- Build command mismatch between GitHub and Vercel
- Output directory not configured correctly
- Environment variables missing

### 4. **GitHub Webhook Issues**
- Webhook not receiving events
- Webhook permissions revoked
- Rate limiting or blocking

---

## ✅ Solution: GitHub Actions Workflow

Since Vercel's GitHub integration can be unreliable, we'll use **GitHub Actions** to explicitly trigger Vercel deployments after successful CI builds.

### Setup Required

1. **Get Vercel Token:**
   - Go to: https://vercel.com/account/tokens
   - Create a new token (or use existing)
   - Copy the token

2. **Get Vercel Project ID:**
   - Go to: https://vercel.com/dashboard
   - Select your project
   - Go to Settings → General
   - Copy the "Project ID"

3. **Get Vercel Org ID:**
   - In the same Settings page
   - Copy the "Team ID" or "Organization ID"

4. **Add to GitHub Secrets:**
   - Go to: https://github.com/apexbusiness-systems/tradeline247aicom/settings/secrets/actions
   - Add these secrets:
     - `VERCEL_TOKEN` = (your Vercel token)
     - `VERCEL_PROJECT_ID` = (your project ID)
     - `VERCEL_ORG_ID` = (your org/team ID)

---

## 🔧 Manual Fix (If You Want to Re-enable Native Integration)

### Step 1: Check Vercel GitHub Integration

1. Go to: https://vercel.com/dashboard
2. Select your project
3. Go to **Settings → Git**
4. Verify:
   - ✅ Repository is connected
   - ✅ Production branch is `main`
   - ✅ Auto-deploy is **enabled**

### Step 2: Reconnect Integration (If Needed)

1. Go to: https://vercel.com/account/integrations
2. Find GitHub integration
3. Click "Configure" or "Reconnect"
4. Grant necessary permissions:
   - Repository access
   - Webhook permissions
   - Read/write permissions

### Step 3: Verify Webhook

1. Go to: https://github.com/apexbusiness-systems/tradeline247aicom/settings/hooks
2. Look for Vercel webhook
3. Check:
   - ✅ Status: Active
   - ✅ Events: Push, Pull Request
   - ✅ Recent deliveries: Should show recent pushes

### Step 4: Test Deployment

```bash
# Make a test commit
git checkout main
git commit --allow-empty -m "test: trigger Vercel deployment"
git push origin main
```

Then check:
- Vercel dashboard for new deployment
- GitHub webhook deliveries for successful events

---

## 🚀 Recommended: Use GitHub Actions (More Reliable)

The GitHub Actions workflow (`.github/workflows/vercel-deploy.yml`) will:
- ✅ Deploy automatically after successful CI builds
- ✅ Only deploy from `main` branch
- ✅ Wait for all CI checks to pass
- ✅ Provide clear deployment status
- ✅ Work even if Vercel integration is broken

---

## 📊 Verification Checklist

After setup, verify:

- [ ] Vercel token added to GitHub Secrets
- [ ] Vercel Project ID added to GitHub Secrets  
- [ ] Vercel Org ID added to GitHub Secrets
- [ ] GitHub Actions workflow file exists
- [ ] Push to `main` triggers deployment
- [ ] Deployment appears in Vercel dashboard
- [ ] Production URL updates with new code

---

## 🐛 Troubleshooting

**Error: "Vercel token not found"**
- Add `VERCEL_TOKEN` to GitHub Secrets

**Error: "Project not found"**
- Verify `VERCEL_PROJECT_ID` matches your project
- Check project exists in your Vercel account

**Error: "Build failed"**
- Check Vercel build logs
- Verify build command: `npm run build`
- Verify output directory: `dist`

**Deployment not triggering**
- Check workflow file exists: `.github/workflows/vercel-deploy.yml`
- Verify workflow runs on: `push` to `main`
- Check CI workflow must complete first (needs: ci/build)

---

## 📚 References

- [Vercel GitHub Integration](https://vercel.com/docs/deployments/git)
- [Vercel CLI](https://vercel.com/docs/cli)
- [GitHub Actions](https://docs.github.com/en/actions)

