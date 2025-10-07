# Hosting Fallback Configuration - Handoff to Human

**Project:** JUBEE.Love (AutoRepAi)  
**Date:** 2025-10-07  
**Version:** R9

## Required Hosting Layer Configuration

To fully resolve deep-link navigation, the hosting platform MUST return `index.html` for all HTML GET requests that don't match real files.

### Configuration Rule

**If using Netlify:**
```toml
# netlify.toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
  conditions = {Role = ["*"]}
  force = false
```

**If using Vercel:**
```json
// vercel.json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

**If using Lovable hosting (unknown if supported):**
Contact Lovable support to configure SPA fallback routing. All non-asset requests should return `index.html` with 200 status.

**If using Nginx:**
```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

**If using Apache:**
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

### Verification

After applying the hosting rule:

1. Open fresh incognito browser
2. Navigate directly to: `https://yourdomain.com/parent/settings`
3. Expected: App shell loads, routes client-side to settings page
4. If you see 404 or blank page: hosting fallback is NOT configured

### Current Status

- ✅ Service Worker updated to serve cached app shell for all navigation
- ⚠️ Hosting fallback configuration: **REQUIRES MANUAL APPLICATION**
- Service Worker version: `v5-20251007-spa-navigation-r9`

### Notes

Lovable platform does not expose hosting configuration through the IDE. This must be configured at the hosting provider level or via Lovable support ticket.

**Without hosting fallback:** First visit to deep links may fail if SW not yet installed. After SW installation, all navigation works offline and online.

**With hosting fallback:** All scenarios work perfectly - cold loads, deep links, offline, online.
