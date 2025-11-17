# Complete Supabase Secrets Configuration Guide

This guide shows you **exactly** where to place each Supabase secret across all environments.

---

## 📍 **Where Each Secret Goes**

### **1. GitHub Secrets** (Required for CI/CD Deployment)

**Location**: https://github.com/apexbusiness-systems/tradeline247/settings/secrets/actions

**Required Secrets:**
- ✅ `SUPABASE_PROJECT_REF` = `hysvqdwmhxnblxfqnszn`
- ✅ `SUPABASE_DB_PASSWORD` = (your database password)
- ✅ `SUPABASE_ACCESS_TOKEN` = (generate at: https://supabase.com/dashboard/account/tokens)

**Purpose**: Used by GitHub Actions workflow to:
- Link to Supabase project (`supabase link`)
- Deploy database migrations (`supabase db push`)
- Deploy edge functions (`supabase functions deploy`)

---

### **2. Supabase Project Secrets** (For Edge Functions Runtime)

**Location**: Set via CLI or Supabase Dashboard

**How to Set:**
```bash
# Via GitHub Actions (automatic)
supabase secrets set TWILIO_ACCOUNT_SID=$TWILIO_ACCOUNT_SID
supabase secrets set TWILIO_AUTH_TOKEN=$TWILIO_AUTH_TOKEN
```

**Or via Supabase Dashboard:**
- Go to: https://supabase.com/dashboard/project/hysvqdwmhxnblxfqnszn/settings/functions
- Click "Secrets" tab
- Add secrets for edge functions to use

**Required Secrets:**
- `TWILIO_ACCOUNT_SID` - For Twilio integration
- `TWILIO_AUTH_TOKEN` - For Twilio webhook validation
- `SUPABASE_SERVICE_ROLE_KEY` - For admin operations (if needed)
- `RESEND_API_KEY` - For email sending (if needed)
- Any other secrets your edge functions need

**Note**: The `SUPABASE_DB_PASSWORD` is **NOT** needed here - this is only for edge function runtime secrets.

---

### **3. Vercel Environment Variables** (For Frontend)

**Location**: https://vercel.com/dashboard → Your Project → Settings → Environment Variables

**Required Variables** (Public - Safe to expose):
- `VITE_SUPABASE_URL` = `https://hysvqdwmhxnblxfqnszn.supabase.co`
- `VITE_SUPABASE_ANON_KEY` = (your anon/public key)
- `VITE_SUPABASE_PROJECT_ID` = `hysvqdwmhxnblxfqnszn`

**Note**: The `SUPABASE_DB_PASSWORD` is **NOT** needed in Vercel - the frontend never needs the database password.

---

### **4. Local Development** (Optional - Only if deploying locally)

**Location**: `.env.local` (gitignored)

**Required Variables** (Only if running `supabase db push` locally):
```bash
SUPABASE_PROJECT_REF=hysvqdwmhxnblxfqnszn
SUPABASE_DB_PASSWORD=your_local_password
SUPABASE_ACCESS_TOKEN=your_access_token
```

**Note**: You only need this if you're running Supabase CLI commands locally. For normal development, you don't need the DB password.

---

## 🎯 **Quick Answer: Where to Place DB Password**

### **✅ YES - Place DB Password Here:**

1. **GitHub Secrets** (Required)
   - https://github.com/apexbusiness-systems/tradeline247/settings/secrets/actions
   - Name: `SUPABASE_DB_PASSWORD`
   - This is the **only required place** for CI/CD deployment

2. **Local `.env.local`** (Optional)
   - Only if you run `supabase db push` or `supabase link` locally
   - Not needed for normal development

### **❌ NO - Don't Place DB Password Here:**

1. **Vercel** - Frontend doesn't need database password
2. **Supabase Project Secrets** - Those are for edge function runtime, not database access
3. **Git Repository** - Never commit secrets to git

---

## 📋 **Complete Setup Checklist**

### For GitHub Actions (CI/CD):
- [ ] Add `SUPABASE_PROJECT_REF` = `hysvqdwmhxnblxfqnszn`
- [ ] Add `SUPABASE_DB_PASSWORD` = (your database password)
- [ ] Add `SUPABASE_ACCESS_TOKEN` = (generate token)

### For Supabase Edge Functions:
- [ ] Set `TWILIO_ACCOUNT_SID` via `supabase secrets set`
- [ ] Set `TWILIO_AUTH_TOKEN` via `supabase secrets set`
- [ ] Set any other edge function secrets needed

### For Vercel (Frontend):
- [ ] Set `VITE_SUPABASE_URL` (if not already set)
- [ ] Set `VITE_SUPABASE_ANON_KEY` (if not already set)
- [ ] Set `VITE_SUPABASE_PROJECT_ID` (if not already set)

---

## 🔍 **Finding Your Database Password**

If you don't have your database password:

1. **Reset it in Supabase Dashboard:**
   - Go to: https://supabase.com/dashboard/project/hysvqdwmhxnblxfqnszn/settings/database
   - Click "Reset Database Password"
   - Copy the new password
   - Add it to GitHub Secrets

2. **Or check existing configuration:**
   - Check if it's already set in your local `.env.local` (if you have one)
   - Check if it's documented in your team's secure password manager

---

## 🚨 **Security Reminders**

- ✅ **DO**: Store secrets in GitHub Secrets, Vercel Environment Variables, or Supabase Project Secrets
- ✅ **DO**: Use different passwords/keys for dev/staging/production
- ❌ **DON'T**: Commit secrets to git
- ❌ **DON'T**: Share secrets in chat, email, or documentation
- ❌ **DON'T**: Put database password in frontend code or Vercel

---

## 📚 **Related Documentation**

- `SUPABASE_SECRETS_SETUP.md` - Detailed GitHub Secrets setup
- `ENVIRONMENT_VARIABLES.md` - Complete environment variables guide
- `.github/PRODUCTION_SECRETS_HYGIENE.md` - Security best practices

