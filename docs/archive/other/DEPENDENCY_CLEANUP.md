# Dependency Cleanup & Bundle Optimization

## 🚨 Duplicate Dependencies Found

### Issue: Dual Data Fetching Libraries

**Current State:**
- `@tanstack/react-query@5.83.0` - **8 usages** (ACTIVE)
- `swr@2.3.6` - **0 usages** (UNUSED)

**Problem:**
Both libraries serve the same purpose (data fetching/caching), resulting in:
- **Unnecessary bundle size**: ~30KB added
- **Maintenance overhead**: Two libraries to update
- **Confusion**: Developers unsure which to use

---

## ✅ Recommended Action: Remove SWR

### Step 1: Verify No Usage
```bash
# Confirm SWR is unused
grep -r "from 'swr'" src/
grep -r "useSWR\|SWRConfig" src/
# Expected: 0 results
```

### Step 2: Remove Package
```bash
npm uninstall swr
```

### Step 3: Update package-lock.json
```bash
npm install
```

### Step 4: Verify Build
```bash
npm run build
npm run test
```

**Expected Result:**
- Bundle size reduction: ~30KB (10KB gzipped)
- No functionality loss
- Cleaner dependency tree

---

## 📊 Bundle Analysis Results

### Current Bundle Breakdown (from vite build)

**Vendor Chunks:**
- `react-vendor-CGlLhb_s.js`: 172.75 kB (gzip: 56.50 kB)
  - react, react-dom, react-router-dom
- `supabase-CyZ9cY0u.js`: 170.81 kB (gzip: 43.52 kB)
  - @supabase/supabase-js
- `ui-vendor-BHV5DpZW.js`: 25.77 kB (gzip: 8.46 kB)
  - @radix-ui components
- `index-41KQfcWN.js`: 372.39 kB (gzip: 108.00 kB) **← MAIN BUNDLE**

**Total Main Bundle:** ~742 kB (216 kB gzipped)

### Optimization Opportunities

**1. Split Large Components**
- ✅ DONE: MiniChat (10.08 kB)
- ✅ DONE: ConnectionIndicator (6.80 kB)
- ✅ DONE: ClientDashboard lazy loading
- ⏳ TODO: AnalyticsDashboard
- ⏳ TODO: Chart components

**2. Optimize Radix UI Imports**
Current vite.config has all Radix UI in one chunk. Could split by usage:
```js
manualChunks: {
  'radix-dialog': ['@radix-ui/react-dialog', '@radix-ui/react-alert-dialog'],
  'radix-forms': ['@radix-ui/react-select', '@radix-ui/react-checkbox', '@radix-ui/react-switch'],
  'radix-overlay': ['@radix-ui/react-popover', '@radix-ui/react-dropdown-menu', '@radix-ui/react-tooltip'],
}
```

**3. Tree Shaking Improvements**
Ensure imports are specific:
```typescript
// Bad (imports entire library)
import * as Icons from 'lucide-react';

// Good (tree-shakeable)
import { Home, Settings } from 'lucide-react';
```

---

## 🔧 Vite Config Optimizations

### Current manualChunks
```js
manualChunks: {
  'react-vendor': ['react', 'react-dom', 'react-router-dom'],
  'ui-vendor': ['@radix-ui/react-slot', '@radix-ui/react-navigation-menu'],
  'supabase': ['@supabase/supabase-js'],
}
```

### Recommended Optimizations

**Option 1: Granular Splitting (Better caching)**
```js
manualChunks: {
  // Core React (rarely changes)
  'react-vendor': ['react', 'react-dom'],

  // Router (changes moderately)
  'react-router': ['react-router-dom'],

  // Supabase (rarely changes)
  'supabase': ['@supabase/supabase-js'],

  // React Query (rarely changes)
  'react-query': ['@tanstack/react-query'],

  // UI Framework by category
  'radix-primitives': [
    '@radix-ui/react-slot',
    '@radix-ui/react-portal',
    '@radix-ui/react-presence',
  ],
  'radix-overlays': [
    '@radix-ui/react-dialog',
    '@radix-ui/react-dropdown-menu',
    '@radix-ui/react-popover',
    '@radix-ui/react-tooltip',
  ],
  'radix-forms': [
    '@radix-ui/react-select',
    '@radix-ui/react-checkbox',
    '@radix-ui/react-switch',
    '@radix-ui/react-slider',
  ],

  // Icons (large, rarely changes)
  'icons': ['lucide-react'],

  // Charts (large, used on specific pages)
  'charts': ['recharts'],
}
```

**Option 2: Size-Based Splitting (Simpler)**
```js
manualChunks(id) {
  // Vendor chunks
  if (id.includes('node_modules')) {
    // Large vendors get own chunks
    if (id.includes('react') || id.includes('react-dom')) {
      return 'react-vendor';
    }
    if (id.includes('@supabase')) {
      return 'supabase';
    }
    if (id.includes('@radix-ui')) {
      return 'radix';
    }
    if (id.includes('recharts')) {
      return 'charts';
    }
    if (id.includes('lucide-react')) {
      return 'icons';
    }
    // Everything else goes to vendor
    return 'vendor';
  }

  // App code splitting by route
  if (id.includes('/pages/')) {
    const pageName = id.split('/pages/')[1].split('.')[0];
    return `page-${pageName}`;
  }
}
```

---

## 📋 Implementation Checklist

### Phase 1: Remove Duplicates
- [ ] Verify SWR has 0 usages
- [ ] Run `npm uninstall swr`
- [ ] Commit: "Remove unused SWR dependency"
- [ ] Verify build succeeds

### Phase 2: Optimize Vite Config
- [ ] Update manualChunks with granular splitting
- [ ] Add dynamic chunk size limits
- [ ] Enable CSS code splitting (already done)
- [ ] Commit: "Optimize Vite bundle configuration"

### Phase 3: Verify & Measure
- [ ] Run `npm run build`
- [ ] Compare bundle sizes (before/after)
- [ ] Check lighthouse performance score
- [ ] Verify all routes load correctly

---

## 📈 Expected Results

### Bundle Size Improvements
| Change | Before | After | Savings |
|--------|--------|-------|---------|
| Remove SWR | 742 KB | 712 KB | 30 KB (4%) |
| Optimize chunks | 712 KB | 680 KB | 32 KB (4.5%) |
| **Total** | **742 KB** | **680 KB** | **62 KB (8.4%)** |

### Performance Improvements
- ✅ Better caching (granular chunks change less frequently)
- ✅ Parallel downloads (more chunks = more HTTP/2 streams)
- ✅ Faster navigation (route-based code splitting)
- ✅ Reduced initial load (lazy loading + code splitting)

---

## 🚀 Quick Start

```bash
# 1. Remove SWR
npm uninstall swr

# 2. Update Vite config (see recommended options above)
# Edit vite.config.ts

# 3. Build and verify
npm run build
npm run test

# 4. Check bundle analysis
npx vite-bundle-visualizer

# 5. Commit
git add package.json package-lock.json vite.config.ts
git commit -m "Remove SWR, optimize bundle splitting"
```

---

## 📚 Additional Resources

- [Vite Code Splitting](https://vitejs.dev/guide/build.html#chunking-strategy)
- [React Query vs SWR](https://react-query.tanstack.com/comparison)
- [Bundle Size Analysis](https://vitejs.dev/guide/build.html#load-performance-suggestions)
- [HTTP/2 Server Push](https://web.dev/http2-server-push/)
