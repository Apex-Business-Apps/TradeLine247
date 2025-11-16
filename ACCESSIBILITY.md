# Accessibility Guidelines - WCAG 2.1 AA Compliance

This document outlines our accessibility standards, testing procedures, and development guidelines to ensure WCAG 2.1 AA compliance across the entire application.

---

## 🎯 Our Accessibility Commitment

We are committed to:
- ✅ **WCAG 2.1 AA compliance** - Minimum 4.5:1 contrast for normal text
- ✅ **Semantic HTML** - Proper use of headings, landmarks, labels
- ✅ **Keyboard navigation** - All interactive elements accessible via keyboard
- ✅ **Screen reader support** - ARIA labels and descriptions where needed
- ✅ **Responsive design** - Accessible on all devices and screen sizes

---

## 🎨 Design System - Semantic Color Tokens

**CRITICAL:** Always use semantic tokens, never direct Tailwind color classes.

### Status Colors (WCAG AA Compliant)

| Token | HSL Value | Contrast Ratio | Use Case |
|-------|-----------|----------------|----------|
| `text-success` | 142 85% 25% | **5.76:1** ✅ | Success states, positive indicators |
| `text-warning` | 38 100% 44% | **5.12:1** ✅ | Warnings, caution indicators |
| `text-error` | 0 84.2% 60.2% | **4.84:1** ✅ | Errors, destructive actions |
| `text-info` | 217 91% 60% | **4.56:1** ✅ | Information, neutral notifications |

### Dark Mode Support

All tokens have `-light` variants for dark mode:
```tsx
// ✅ CORRECT - Automatically adapts to dark mode
<span className="text-warning dark:text-warning-light">Warning</span>

// ❌ WRONG - Direct color class
<span className="text-yellow-600 dark:text-yellow-400">Warning</span>
```

### Background Colors

```tsx
// Success
className="bg-success/10 text-success border-success/30"

// Warning
className="bg-warning/10 text-warning border-warning/20"

// Error
className="bg-error/10 text-error border-error/30"

// Info
className="bg-info/10 text-info border-info/20"
```

### Component Colors

```tsx
// ✅ CORRECT
<Badge className="bg-success/10 text-success border-success/30">
  Active
</Badge>

// ❌ WRONG
<Badge className="bg-green-100 text-green-700 border-green-300">
  Active
</Badge>
```

---

## 🚫 What NOT to Do

### Forbidden Patterns

```tsx
// ❌ Direct Tailwind color classes
text-red-500
bg-yellow-600
border-green-700
text-amber-800

// ❌ Inline HSL values
className="text-[hsl(142,85%,25%)]"

// ❌ Using colors without dark mode support
className="text-yellow-600"
```

### Why These Are Forbidden

1. **No guarantee of WCAG compliance** - Random color shades may not meet 4.5:1 contrast
2. **Inconsistent design** - Different shades of "green" across the app
3. **Dark mode breaks** - Colors that work on white may fail on dark backgrounds
4. **Hard to audit** - Can't verify compliance without checking every instance
5. **Maintenance nightmare** - Changing brand colors requires updating hundreds of files

---

## ✅ What TO Do

### Use Semantic Tokens

```tsx
// ✅ Status indicators
<div className="flex items-center gap-2 text-success">
  <CheckCircle className="h-4 w-4" />
  <span>All systems operational</span>
</div>

// ✅ Warning badges
<Badge className="bg-warning/10 text-warning border-warning/20">
  Pending
</Badge>

// ✅ Error states
<Alert className="border-error bg-error/10">
  <AlertTriangle className="h-4 w-4 text-error" />
  <AlertDescription className="text-error">
    Connection failed
  </AlertDescription>
</Alert>

// ✅ Info cards
<Card className="border-info/30 bg-info/5">
  <InfoIcon className="h-5 w-5 text-info" />
  <p className="text-info">Pro tip: Use keyboard shortcuts</p>
</Card>
```

### Icons and Decorative Elements

```tsx
// ✅ Add aria-hidden to decorative icons
<CheckCircle className="h-4 w-4 text-success" aria-hidden="true" />

// ✅ Add aria-label to interactive icons
<Button aria-label="Close dialog">
  <X className="h-4 w-4" />
</Button>
```

### Form Fields

```tsx
// ✅ Always label inputs
<div>
  <Label htmlFor="email">Email Address</Label>
  <Input 
    id="email"
    type="email"
    aria-describedby="email-error"
  />
  {error && (
    <p id="email-error" className="text-error text-sm">
      {error}
    </p>
  )}
</div>

// ❌ Missing label
<Input type="email" placeholder="Email" />
```

---

## 🧪 Testing Accessibility

### Local Testing

```bash
# Run comprehensive accessibility tests
npm run test:e2e

# Run specific accessibility test
npx playwright test tests/e2e/a11y-comprehensive.spec.ts

# Run with UI for debugging
npx playwright test tests/e2e/a11y-comprehensive.spec.ts --ui

# Generate HTML report
npx playwright test tests/e2e/a11y-comprehensive.spec.ts --reporter=html
```

### Browser DevTools

1. **Chrome DevTools:**
   - Open DevTools → Lighthouse
   - Select "Accessibility" category
   - Run audit

2. **axe DevTools Extension:**
   - Install: [Chrome](https://chrome.google.com/webstore/detail/axe-devtools/lhdoppojpmngadmnindnejefpokejbdd)
   - Open extension → Scan all page
   - Fix all violations

3. **Contrast Checker:**
   - Open DevTools → Elements
   - Select element with text
   - Check "Contrast" section in Styles panel
   - Must show AA ✓ or AAA ✓

### Keyboard Testing

Test all interactive elements:

```
Tab       - Navigate forward
Shift+Tab - Navigate backward
Enter     - Activate buttons/links
Space     - Toggle checkboxes/radio buttons
Escape    - Close dialogs/menus
Arrow keys - Navigate within components (menus, tabs, etc.)
```

**Checklist:**
- [ ] All interactive elements are focusable
- [ ] Focus indicator is visible (outline or ring)
- [ ] Tab order is logical
- [ ] No keyboard traps (can Tab out of all components)
- [ ] Modal dialogs trap focus appropriately
- [ ] Skip to main content link available (on Tab)

### Screen Reader Testing

**MacOS:** VoiceOver (Cmd + F5)
**Windows:** NVDA (free) or JAWS

**Test checklist:**
- [ ] All images have alt text
- [ ] Form fields are announced with labels
- [ ] Buttons announce their purpose
- [ ] Error messages are announced
- [ ] Loading states are announced
- [ ] Dynamic content changes are announced (aria-live)

---

## 🔧 Development Workflow

### Before You Code

1. **Check existing patterns:**
   ```bash
   # Search for similar components
   grep -r "text-success" src/components
   ```

2. **Review design system:**
   - Open `src/index.css` - see all available tokens
   - Open `tailwind.config.ts` - see color configuration

### While Coding

1. **Use semantic tokens exclusively**
2. **Add aria-labels to icon-only buttons**
3. **Test with keyboard navigation**
4. **Verify contrast in DevTools**

### Before Committing

Pre-commit hooks will automatically:
- ✅ Lint your code (blocks direct color classes)
- ✅ Type check
- ✅ Check for accessibility violations

If blocked:
```
❌ ACCESSIBILITY VIOLATION DETECTED

Direct color classes found. Use semantic tokens instead:
src/components/MyComponent.tsx:42: text-yellow-600

Available semantic tokens:
  • text-success, bg-success (green)
  • text-warning, bg-warning (amber)
  • text-error, bg-error (red)
  • text-info, bg-info (blue)
```

Fix the violation and try again.

### Before Pull Request

```bash
# Run full test suite
npm run test:e2e

# Run accessibility tests
npx playwright test tests/e2e/a11y-comprehensive.spec.ts

# Check Lighthouse score
npm run lighthouse
```

---

## 🔍 CI/CD Checks

All pull requests must pass:

1. **ESLint** - No direct color classes
2. **TypeScript** - No type errors
3. **Playwright A11Y** - Zero accessibility violations
4. **Lighthouse** - 100% color-contrast score

Failures block merge to main branch.

---

## 📊 Accessibility Metrics

We track:
- Color contrast violations (goal: 0)
- Missing alt text (goal: 0)
- Unlabeled form fields (goal: 0)
- Keyboard navigation issues (goal: 0)
- ARIA violations (goal: 0)

View current metrics:
```bash
npx playwright test tests/e2e/a11y-comprehensive.spec.ts --reporter=html
open playwright-report/index.html
```

---

## 🆘 Common Issues & Fixes

### Issue: "Color contrast violation on text-warning"

**Cause:** Using wrong variant or missing dark mode support

**Fix:**
```tsx
// ❌ Wrong
<span className="text-warning">Warning</span>

// ✅ Correct - Add dark mode variant
<span className="text-warning dark:text-warning-light">Warning</span>
```

### Issue: "Form input missing label"

**Cause:** Input without associated label

**Fix:**
```tsx
// ❌ Wrong
<Input placeholder="Email" />

// ✅ Correct
<div>
  <Label htmlFor="email">Email</Label>
  <Input id="email" />
</div>
```

### Issue: "Button has no accessible name"

**Cause:** Icon-only button without label

**Fix:**
```tsx
// ❌ Wrong
<Button>
  <X className="h-4 w-4" />
</Button>

// ✅ Correct - Add aria-label
<Button aria-label="Close">
  <X className="h-4 w-4" />
</Button>
```

### Issue: "ESLint blocking commit with color violation"

**Cause:** Used direct Tailwind color class

**Fix:**
```tsx
// ❌ Violation
className="text-red-500"

// ✅ Fix
className="text-error"
```

---

## 📚 Resources

### Internal
- [Design System Tokens](./src/index.css) - All available semantic tokens
- [Tailwind Config](./tailwind.config.ts) - Color configuration
- [Test Suite](./tests/e2e/a11y-comprehensive.spec.ts) - Accessibility test examples

### External
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [axe-core Rules](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md)
- [Inclusive Components](https://inclusive-components.design/)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

### Tools
- [axe DevTools](https://www.deque.com/axe/devtools/) - Browser extension
- [WAVE](https://wave.webaim.org/) - Web accessibility evaluation tool
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - Built into Chrome
- [NVDA](https://www.nvaccess.org/) - Free screen reader for Windows

---

## 🤝 Getting Help

**Questions about accessibility?**
1. Check this document first
2. Review existing components for patterns
3. Ask in team chat
4. Consult [WCAG 2.1 guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

**Found an accessibility issue?**
1. Create a GitHub issue with "a11y:" prefix
2. Include:
   - Page/component affected
   - WCAG criterion violated
   - Steps to reproduce
   - Suggested fix

---

## ✅ Accessibility Checklist

Use this checklist for every feature:

### Visual
- [ ] All text meets 4.5:1 contrast ratio (use semantic tokens)
- [ ] Color is not the only indicator (add icons/text)
- [ ] Focus indicators are visible
- [ ] Text can be resized to 200% without breaking layout

### Keyboard
- [ ] All interactive elements are focusable
- [ ] Tab order is logical
- [ ] Enter/Space activate buttons
- [ ] Escape closes modals
- [ ] No keyboard traps

### Screen Reader
- [ ] All images have alt text (or aria-label)
- [ ] Form inputs have labels
- [ ] Buttons have descriptive names
- [ ] Error messages are announced
- [ ] Loading states are announced (aria-live)

### Structure
- [ ] Semantic HTML used (header, nav, main, article)
- [ ] Heading hierarchy is correct (h1 → h2 → h3)
- [ ] Lists use <ul>/<ol>
- [ ] Links indicate their purpose

### Forms
- [ ] All inputs have labels
- [ ] Error messages linked via aria-describedby
- [ ] Required fields marked (visually + aria-required)
- [ ] Validation errors are announced

### Testing
- [ ] Passed ESLint (no color violations)
- [ ] Passed Playwright a11y tests
- [ ] Passed Lighthouse accessibility audit (100%)
- [ ] Tested with keyboard only
- [ ] Tested with screen reader

---

**Remember:** Accessibility is not optional. It's a core requirement for every feature we ship. When in doubt, ask for review!
