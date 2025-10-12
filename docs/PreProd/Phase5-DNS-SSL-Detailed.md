# PHASE 5: DNS & SSL Configuration — Detailed Report

**Date:** 2025-10-11 (America/Edmonton)  
**Status:** ⏳ AWAITING DNS CONFIGURATION  
**Gate:** P0 — Blocks production deploy

---

## Objective

Configure DNS records at Webnames for `autorepai.ca` domain to route traffic correctly:
- `www.autorepai.ca` → CNAME to Lovable hosting
- `autorepai.ca` (apex) → 301 redirect to `https://www.autorepai.ca`
- Remove any conflicting A/AAAA records for `www` subdomain
- Verify SSL certificate is valid and auto-renewed

---

## DNS Configuration Requirements

### Step 1: Determine Lovable Hostname

**Action:** Check Lovable project settings for the deployment hostname.

**Expected Format:**
```
[project-name].lovable.app
OR
[custom-subdomain].lovable.dev
```

**Placeholder:** `autorepai.lovable.app` (replace with actual hostname)

---

### Step 2: Configure CNAME for www Subdomain

**Registrar:** Webnames (webnames.ca)  
**DNS Manager:** https://www.webnames.ca/

**Record to Create:**

| Type  | Name | Value                    | TTL  |
|-------|------|--------------------------|------|
| CNAME | www  | autorepai.lovable.app.   | 3600 |

**Important:**
- Trailing dot (`.`) is required in CNAME value
- Remove any existing A or AAAA records for `www.autorepai.ca`

---

### Step 3: Configure Apex Redirect (301)

**Option A: Webnames Web Forwarding**

If Webnames supports URL forwarding:

| Type              | Source          | Destination                   | Type |
|-------------------|-----------------|-------------------------------|------|
| URL Forwarding    | autorepai.ca    | https://www.autorepai.ca      | 301  |

**Option B: A Record + Server-Side Redirect**

If web forwarding unavailable:

| Type | Name | Value            | TTL  |
|------|------|------------------|------|
| A    | @    | [Lovable IP]     | 3600 |

Then configure redirect in Lovable platform settings.

**Lovable IP:** Check Lovable docs or support for current IP address (example: `185.158.133.1`)

---

### Step 4: Remove Conflicting Records

**Action:** Delete these if they exist:

- A record for `www.autorepai.ca`
- AAAA record for `www.autorepai.ca`
- Any other CNAME for `www`

**Why:** CNAME cannot coexist with other record types for the same name.

---

## Verification Commands

### Test #1: Verify CNAME Resolution

```bash
nslookup www.autorepai.ca
```

**Expected Output:**

```
Server:     8.8.8.8
Address:    8.8.8.8#53

www.autorepai.ca    canonical name = autorepai.lovable.app.
Name:   autorepai.lovable.app
Address: 185.158.133.1
```

**Pass Criteria:**
- ✅ Shows `canonical name` pointing to Lovable hostname
- ✅ Resolves to an IP address

---

### Test #2: Verify Apex 301 Redirect

```bash
curl -sI https://autorepai.ca | grep -E 'HTTP/|Location'
```

**Expected Output:**

```
HTTP/2 301
location: https://www.autorepai.ca/
```

**Alternative (if HTTP → HTTPS redirect first):**

```
HTTP/1.1 301 Moved Permanently
location: https://autorepai.ca

HTTP/2 301
location: https://www.autorepai.ca/
```

**Pass Criteria:**
- ✅ Final redirect lands at `https://www.autorepai.ca/`
- ✅ Uses HTTPS (not HTTP)

---

### Test #3: Verify SSL Certificate

```bash
curl -vI https://www.autorepai.ca/ 2>&1 | grep -E 'subject:|issuer:|SSL|TLS'
```

**Expected Output:**

```
* TLSv1.3 (OUT), TLS handshake, Client hello (1):
* TLSv1.3 (IN), TLS handshake, Server hello (2):
subject: CN=www.autorepai.ca
issuer: C=US; O=Let's Encrypt; CN=R3
SSL certificate verify ok.
```

**Pass Criteria:**
- ✅ Subject matches `www.autorepai.ca`
- ✅ Valid issuer (Let's Encrypt or similar)
- ✅ TLS 1.2+ negotiated
- ✅ No certificate errors

---

### Test #4: Browser Certificate Check

**Action:**
1. Open `https://www.autorepai.ca/` in Chrome
2. Click padlock icon → Connection is secure
3. View certificate details

**Expected:**
- Issued to: `www.autorepai.ca`
- Valid from: [recent date]
- Valid until: [90 days for Let's Encrypt]
- No warnings or errors

**Screenshot:** `artifacts/phase5/ssl-certificate-browser.png`

---

## DNS Propagation Timing

**Expected Timeline:**

| Milestone                  | Duration    | Check Method             |
|----------------------------|-------------|--------------------------|
| DNS update applied         | Immediate   | Webnames dashboard       |
| Propagation starts         | 5-15 min    | `nslookup`               |
| Global propagation         | 1-48 hours  | https://dnschecker.org   |
| SSL certificate issued     | 0-10 min    | Lovable auto-provisions  |

**Recommendation:** Wait 24 hours after DNS changes before running Phase 6 tests.

---

## Troubleshooting Guide

### Issue #1: CNAME Not Resolving

**Symptom:**
```bash
nslookup www.autorepai.ca
# Output: NXDOMAIN or points to old IP
```

**Checklist:**
1. Verify CNAME record saved in Webnames dashboard
2. Check for typos in hostname (trailing dot?)
3. Confirm no conflicting A/AAAA records exist
4. Wait for DNS propagation (up to 48 hours)
5. Try different DNS servers:
   ```bash
   nslookup www.autorepai.ca 8.8.8.8  # Google DNS
   nslookup www.autorepai.ca 1.1.1.1  # Cloudflare DNS
   ```

---

### Issue #2: Apex Not Redirecting

**Symptom:**
```bash
curl -I https://autorepai.ca
# Output: 404 or no redirect
```

**Checklist:**
1. Verify URL forwarding is enabled in Webnames
2. Check if A record for `@` (apex) exists
3. Confirm redirect type is set to 301 (permanent)
4. Test HTTP (not HTTPS) first:
   ```bash
   curl -I http://autorepai.ca
   ```
5. Contact Lovable support to confirm apex redirect support

---

### Issue #3: SSL Certificate Mismatch

**Symptom:**
```bash
curl -vI https://www.autorepai.ca/
# Output: SSL certificate problem: unable to get local issuer certificate
```

**Checklist:**
1. Verify DNS CNAME is pointing to correct Lovable hostname
2. Wait 10 minutes for Lovable to auto-provision SSL
3. Check Lovable dashboard for SSL status
4. Force SSL renewal if supported by platform
5. Contact Lovable support if cert not issued after 1 hour

---

### Issue #4: Mixed Content Warnings

**Symptom:** Browser shows "Not Secure" warning despite valid SSL

**Checklist:**
1. Open DevTools → Console
2. Look for "Mixed Content" errors
3. Ensure all resources (CSS, JS, images) use HTTPS URLs
4. Check if API calls use `https://niorocndzcflrwdrofsp.supabase.co`
5. Update any hardcoded `http://` URLs to `https://`

---

## Manual Verification Steps

### Step 1: Access Webnames DNS Manager

1. Login: https://www.webnames.ca/login
2. Navigate to: Domains → autorepai.ca → DNS Management

### Step 2: Create CNAME Record

1. Click "Add Record"
2. Type: CNAME
3. Name: `www`
4. Value: `autorepai.lovable.app.` (with trailing dot)
5. TTL: 3600
6. Save

### Step 3: Configure Apex Redirect

1. Look for "URL Forwarding" or "Web Redirect" section
2. Source: `autorepai.ca`
3. Destination: `https://www.autorepai.ca`
4. Type: 301 (Permanent)
5. Save

### Step 4: Remove Conflicting Records

1. Delete any A records for `www.autorepai.ca`
2. Delete any AAAA records for `www.autorepai.ca`
3. Confirm changes

### Step 5: Wait for Propagation

```bash
# Check every 15 minutes
watch -n 900 'nslookup www.autorepai.ca && curl -sI https://autorepai.ca | grep Location'
```

### Step 6: Run Verification Tests

Once DNS propagates (CNAME resolves correctly):

```bash
# Test CNAME
nslookup www.autorepai.ca > artifacts/phase5/cname-resolution.txt

# Test 301 redirect
curl -sI https://autorepai.ca > artifacts/phase5/apex-redirect.txt

# Test SSL
curl -vI https://www.autorepai.ca/ 2>&1 | grep -E 'TLS|subject:' > artifacts/phase5/ssl-details.txt
```

### Step 7: Update This Document

Replace `[Pending]` sections with actual outputs and timestamps.

---

## Test Results

### Execution Metadata

**Executed:** _[Pending]_  
**Tester:** _[Pending]_  
**DNS Registrar:** Webnames  
**Hosting Platform:** Lovable

---

### Test #1: CNAME Resolution

**Command:**
```bash
nslookup www.autorepai.ca
```

**Output:**
```
[Paste raw output here]
```

**Analysis:**
- [ ] ✅ CNAME points to Lovable hostname
- [ ] ✅ Resolves to valid IP
- [ ] ❌ Issue: _[describe problem]_

---

### Test #2: Apex 301 Redirect

**Command:**
```bash
curl -sI https://autorepai.ca
```

**Output:**
```
[Paste raw output here]
```

**Analysis:**
- [ ] ✅ Returns HTTP 301
- [ ] ✅ Location header: `https://www.autorepai.ca/`
- [ ] ❌ Issue: _[describe problem]_

---

### Test #3: SSL Certificate

**Command:**
```bash
curl -vI https://www.autorepai.ca/ 2>&1 | grep subject:
```

**Output:**
```
[Paste raw output here]
```

**Analysis:**
- [ ] ✅ Subject: `CN=www.autorepai.ca`
- [ ] ✅ Valid issuer
- [ ] ✅ TLS 1.3
- [ ] ❌ Issue: _[describe problem]_

---

### Test #4: Browser SSL Check

**Screenshot:** `artifacts/phase5/ssl-browser.png`

**Analysis:**
- [ ] ✅ Padlock shows "Secure"
- [ ] ✅ Certificate details correct
- [ ] ❌ Issue: _[describe problem]_

---

## Gate Approval Criteria

### ✅ PASS Conditions

1. **CNAME for www:**
   - `nslookup www.autorepai.ca` shows CNAME to Lovable
   - Resolves to valid IP address

2. **Apex Redirect:**
   - `curl -I https://autorepai.ca` returns 301
   - Location header: `https://www.autorepai.ca/`

3. **SSL Certificate:**
   - Valid for `www.autorepai.ca`
   - Trusted issuer (Let's Encrypt, etc.)
   - TLS 1.2+ negotiated

4. **Evidence:**
   - All command outputs saved
   - Browser screenshot of valid SSL

### ❌ FAIL Conditions (NO-GO)

- CNAME not resolving or points to wrong host
- Apex redirect missing or returns 404
- SSL certificate invalid, expired, or mismatched
- Browser shows "Not Secure" warning

---

## Evidence Attachments

### Command Outputs

- [ ] `artifacts/phase5/cname-resolution.txt`
- [ ] `artifacts/phase5/apex-redirect.txt`
- [ ] `artifacts/phase5/ssl-details.txt`

### Screenshots

- [ ] `artifacts/phase5/webnames-dns-config.png` — Webnames dashboard showing CNAME
- [ ] `artifacts/phase5/ssl-browser.png` — Chrome padlock showing valid cert
- [ ] `artifacts/phase5/dnschecker-global.png` — https://dnschecker.org showing global propagation

---

## DNS Record Summary

**Final Configuration:**

| Record Type | Name            | Value                    | TTL  | Purpose                |
|-------------|-----------------|--------------------------|------|------------------------|
| CNAME       | www             | autorepai.lovable.app.   | 3600 | Route www to Lovable   |
| URL Forward | autorepai.ca    | https://www.autorepai.ca | -    | Apex → www redirect    |

**Removed Records:**
- A record for `www` (conflicted with CNAME)
- AAAA record for `www` (conflicted with CNAME)

---

## Sign-Off

- [ ] CNAME for `www.autorepai.ca` **CONFIGURED** and resolving
- [ ] Apex redirect **CONFIGURED** (301 to https://www.autorepai.ca)
- [ ] SSL certificate **VALID** and trusted
- [ ] All evidence collected and saved

**Approved By:** _[Pending]_  
**Date:** _[Pending]_  

---

## References

- [Webnames DNS Management](https://www.webnames.ca/support/dns)
- [Lovable Custom Domains](https://docs.lovable.dev/features/custom-domains)
- [DNS Propagation Checker](https://dnschecker.org)
- [Let's Encrypt Certificate Info](https://letsencrypt.org/docs/)
- [CNAME vs A Record](https://www.cloudflare.com/learning/dns/dns-records/dns-cname-record/)

---

**Next Phase:** Phase 6 — Monitoring & Alerts (UptimeRobot, GitHub Actions, Sentry, Supabase)
