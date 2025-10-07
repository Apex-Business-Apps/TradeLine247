# Phase 5: DNS & SSL Configuration

**Status:** 🔴 **BLOCKED - MANUAL CONFIGURATION REQUIRED**  
**Date:** 2025-10-07  
**Domain Registrar:** Webnames (assumed)  
**Target Domain:** autorepai.ca  
**Location:** America/Edmonton

---

## 🎯 Objective

Configure DNS for autorepai.ca to:
1. **WWW subdomain**: Point to Lovable hosting via CNAME
2. **Apex domain**: 301 redirect to https://www.autorepai.ca
3. Verify SSL certificate is valid for both www and apex
4. Ensure proper DNS propagation globally

---

## ⚙️ DNS Configuration Steps

### Option A: Lovable Hosting (Recommended)

If using Lovable's hosting platform:

1. **Navigate to Lovable Project Settings**
   - Go to your project in Lovable
   - Click **Settings** → **Domains**

2. **Connect Custom Domain**
   - Click **Connect Domain**
   - Enter: `autorepai.ca`
   - Lovable will provide DNS records

3. **Configure DNS at Webnames**
   
   **For WWW subdomain:**
   ```
   Type: CNAME
   Name: www
   Value: [Lovable-provided-value].lovable.app
   TTL: 3600 (or Auto)
   ```

   **For Apex domain (root):**
   ```
   Type: A
   Name: @
   Value: 185.158.133.1
   TTL: 3600 (or Auto)
   ```

   *Note: Lovable automatically handles 301 redirect from apex to www*

4. **Wait for DNS Propagation**
   - Typical: 1-24 hours
   - Maximum: 48 hours

5. **SSL Certificate**
   - Lovable auto-provisions Let's Encrypt certificate
   - Covers both www.autorepai.ca and autorepai.ca
   - Automatic renewal every 90 days

---

### Option B: Custom Hosting (If Not Using Lovable)

If self-hosting or using another provider:

1. **WWW CNAME Record**
   ```
   Type: CNAME
   Name: www
   Value: [your-hosting-provider].com
   TTL: 3600
   ```

2. **Apex A Record**
   ```
   Type: A
   Name: @
   Value: [your-hosting-IP-address]
   TTL: 3600
   ```

3. **301 Redirect Configuration**
   
   Configure your web server to redirect apex to www:

   **Nginx Example:**
   ```nginx
   server {
       listen 80;
       listen 443 ssl;
       server_name autorepai.ca;
       return 301 https://www.autorepai.ca$request_uri;
   }
   ```

   **Apache Example:**
   ```apache
   <VirtualHost *:80>
       ServerName autorepai.ca
       Redirect permanent / https://www.autorepai.ca/
   </VirtualHost>
   ```

4. **SSL Certificate Setup**
   - Use Let's Encrypt (free) or commercial certificate
   - Must cover both autorepai.ca and www.autorepai.ca
   - Use wildcard cert or SAN certificate

---

## 🧪 Verification Tests

### Test #1: DNS Resolution - WWW
```bash
nslookup www.autorepai.ca
```

**Expected Output:**
```
Server:  [DNS-Server]
Address: [DNS-IP]

Non-authoritative answer:
Name:    www.autorepai.ca
Address: [Hosting-IP-Address]
```

or for CNAME:
```
www.autorepai.ca    canonical name = [target-host].lovable.app
```

---

### Test #2: DNS Resolution - Apex
```bash
nslookup autorepai.ca
```

**Expected Output:**
```
Server:  [DNS-Server]
Address: [DNS-IP]

Non-authoritative answer:
Name:    autorepai.ca
Address: [Hosting-IP-Address]
```

---

### Test #3: HTTP to HTTPS Redirect
```bash
curl -I http://www.autorepai.ca/
```

**Expected Output:**
```http
HTTP/1.1 301 Moved Permanently
Location: https://www.autorepai.ca/
```

---

### Test #4: Apex to WWW Redirect
```bash
curl -I https://autorepai.ca/
```

**Expected Output:**
```http
HTTP/2 301
Location: https://www.autorepai.ca/
```

---

### Test #5: SSL Certificate Validation
```bash
curl -vI https://www.autorepai.ca/ 2>&1 | grep -E 'subject|issuer|expire'
```

**Expected:**
- Subject: CN=www.autorepai.ca or CN=*.autorepai.ca
- Issuer: Let's Encrypt or trusted CA
- Expire date: Future date (not expired)

---

### Test #6: DNS Propagation Check
```bash
# Check from multiple global DNS servers
dig @8.8.8.8 www.autorepai.ca +short
dig @1.1.1.1 www.autorepai.ca +short
dig @208.67.222.222 www.autorepai.ca +short
```

**Expected:** All return same IP address or CNAME target

---

## 📋 Verification Checklist

- [ ] **DNS Config**: WWW CNAME record added to Webnames
- [ ] **DNS Config**: Apex A record added to Webnames
- [ ] **DNS Propagation**: WWW resolves correctly (nslookup)
- [ ] **DNS Propagation**: Apex resolves correctly (nslookup)
- [ ] **Global DNS**: Propagated to Google (8.8.8.8), Cloudflare (1.1.1.1)
- [ ] **Redirect**: HTTP → HTTPS redirect works
- [ ] **Redirect**: Apex → WWW redirect works (301)
- [ ] **SSL Certificate**: Valid for www.autorepai.ca
- [ ] **SSL Certificate**: Valid for autorepai.ca (apex)
- [ ] **SSL Certificate**: Issued by trusted CA
- [ ] **SSL Certificate**: Expiry date > 30 days from now
- [ ] **Browser Test**: https://www.autorepai.ca loads without warnings
- [ ] **Browser Test**: https://autorepai.ca redirects to www
- [ ] **Browser Test**: http://autorepai.ca redirects to https://www

---

## 🚨 Common Issues & Troubleshooting

### Issue #1: DNS Not Propagating

**Symptoms:**
```
nslookup www.autorepai.ca
** server can't find www.autorepai.ca: NXDOMAIN
```

**Solutions:**
1. Wait 24-48 hours for full propagation
2. Clear local DNS cache:
   - Windows: `ipconfig /flushdns`
   - Mac: `sudo dscacheutil -flushcache`
   - Linux: `sudo systemd-resolve --flush-caches`
3. Check DNS records at registrar (Webnames dashboard)
4. Use online tool: https://dnschecker.org

---

### Issue #2: SSL Certificate Not Valid

**Symptoms:**
```
curl: (60) SSL certificate problem: certificate has expired
```

**Solutions:**
1. Wait 1-2 hours after DNS propagation for auto-provisioning
2. Check Lovable dashboard for SSL status
3. Manually trigger certificate renewal (if self-hosting)
4. Verify both apex and www are in certificate SAN

---

### Issue #3: Apex Not Redirecting to WWW

**Symptoms:**
```bash
curl -I https://autorepai.ca/
HTTP/2 200  # Should be 301
```

**Solutions:**
1. Check hosting provider redirect rules
2. Verify Lovable auto-redirect is enabled
3. Add manual redirect in hosting config (see Option B above)

---

## 📊 Test Results

### nslookup - WWW
```
[INSERT: Output of nslookup www.autorepai.ca]
```

**Status:** ⏳ PENDING

---

### nslookup - Apex
```
[INSERT: Output of nslookup autorepai.ca]
```

**Status:** ⏳ PENDING

---

### curl - Redirect Tests
```
[INSERT: Output of curl -I http://www.autorepai.ca/]
[INSERT: Output of curl -I https://autorepai.ca/]
```

**Status:** ⏳ PENDING

---

### SSL Certificate Details
```
[INSERT: Output of openssl s_client -connect www.autorepai.ca:443 -servername www.autorepai.ca]
```

**Status:** ⏳ PENDING

---

## ✅ Gate Approval Criteria

**Gate Status:** 🔴 **BLOCKED**

This gate turns **GREEN** when:

1. ✅ WWW CNAME resolves to Lovable hosting
2. ✅ Apex A record resolves to hosting IP
3. ✅ DNS propagated globally (verified via 3+ DNS servers)
4. ✅ HTTP redirects to HTTPS (301)
5. ✅ Apex redirects to WWW (301)
6. ✅ SSL certificate valid for both www and apex
7. ✅ SSL certificate issued by trusted CA
8. ✅ SSL expiry > 30 days from now
9. ✅ Browser loads https://www.autorepai.ca without warnings
10. ✅ All test outputs documented with screenshots

---

## 🔗 Manual Configuration Steps

**⚠️ Action Required:**

1. **Log in to Webnames**
   - Navigate to your domain management dashboard
   - Select `autorepai.ca`

2. **Add DNS Records**
   - Click **DNS Management** or **Nameservers**
   - Add WWW CNAME (if using Lovable, get value from Lovable dashboard)
   - Add Apex A record (if required by hosting provider)

3. **Verify in Lovable Dashboard**
   - Check Domain verification status
   - Wait for SSL provisioning (auto)

4. **Run Verification Tests**
   - Execute all `nslookup` and `curl` commands above
   - Paste output into this document

5. **Browser Test**
   - Open https://www.autorepai.ca in Chrome/Firefox
   - Click padlock icon → View certificate
   - Screenshot certificate details

6. **Update Gate Status**
   - Mark checklist items complete
   - Attach all screenshots
   - Change status to GREEN

---

## 📸 Evidence Attachments

### Webnames DNS Configuration
```
[INSERT: Screenshot of Webnames DNS management showing CNAME and A records]
```

### nslookup Results
```
[INSERT: Screenshot of terminal showing nslookup commands and output]
```

### curl Redirect Tests
```
[INSERT: Screenshot of terminal showing curl redirect tests]
```

### Browser SSL Certificate
```
[INSERT: Screenshot of browser showing valid SSL certificate details]
```

### DNSChecker.org Global Propagation
```
[INSERT: Screenshot of https://dnschecker.org showing global DNS propagation]
```

---

## 🔗 References

- [Lovable Custom Domain Setup](https://docs.lovable.dev/)
- [DNSChecker.org](https://dnschecker.org)
- [Let's Encrypt Certificate Process](https://letsencrypt.org/how-it-works/)
- [301 vs 302 Redirects](https://moz.com/learn/seo/redirection)

---

**Last Updated:** 2025-10-07  
**Next Review:** After DNS records configured and propagated  
**Sign-Off Required:** DevOps Lead, Domain Administrator
