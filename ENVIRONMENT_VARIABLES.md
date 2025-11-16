# Environment Variables Guide

## Overview

TradeLine 24/7 uses environment variables to configure different aspects of the application. This guide explains how environment variables are managed across different environments.

---

## 📁 File Structure

### `.env.production` ✅ **COMMITTED**
- **Purpose**: Contains PUBLIC environment variables safe to commit
- **Usage**: Automatically loaded by Vite during production builds
- **Contains**: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, BASE_URL

**Why it's safe to commit**: These are `VITE_` prefixed variables embedded in the client bundle. The anon key is public and protected by Row Level Security (RLS).

### `.env.local` ❌ **NOT COMMITTED**
- **Purpose**: Local development overrides
- **Usage**: Create from `.env.example` for local development

### `.env.example` ✅ **COMMITTED (Template)**
- **Purpose**: Template showing all required variables

---

## 🚀 Setup Instructions

### Local Development
```bash
cp .env.example .env.local
```

### Vercel Deployment
- Public variables auto-loaded from `.env.production`
- Secrets configured in Vercel Dashboard

### CI/GitHub Actions
- Public variables auto-loaded from `.env.production`
- Secrets in Repository Settings

---

**Last Updated**: November 16, 2025
