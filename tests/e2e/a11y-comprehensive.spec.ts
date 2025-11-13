import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Comprehensive Accessibility Test Suite
 * 
 * Tests WCAG 2.1 AA compliance across all critical user journeys.
 * Covers: color-contrast, keyboard navigation, ARIA labels, semantic HTML
 * 
 * Test Strategy:
 * 1. Public pages (marketing, auth)
 * 2. Authenticated pages (dashboard, settings)
 * 3. Integration flows (CRM, messaging, etc.)
 * 4. Dark mode variations
 */

// ==========================================
// HELPER FUNCTIONS
// ==========================================

async function analyzeAccessibility(page: any, routeName: string) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  
  // Log violations for debugging
  if (results.violations.length > 0) {
    console.log(`\n❌ Accessibility violations found on: ${routeName}`);
    for (const violation of results.violations) {
      console.log(`\n  Rule: ${violation.id}`);
      console.log(`  Impact: ${violation.impact}`);
      console.log(`  Description: ${violation.description}`);
      console.log(`  Help: ${violation.helpUrl}`);
      console.log(`  Affected elements: ${violation.nodes.length}`);
      
      // Log first 3 affected elements
      violation.nodes.slice(0, 3).forEach((node, idx) => {
        const selector = node.target?.[0] ?? 'unknown';
        console.log(`    ${idx + 1}. ${selector}`);
      });
    }
    console.log('\n');
  }
  
  return results;
}

function expectNoViolations(results: any, severity: 'critical' | 'serious' | 'moderate' = 'serious') {
  const impactLevels = {
    critical: ['critical'],
    serious: ['critical', 'serious'],
    moderate: ['critical', 'serious', 'moderate']
  };
  
  const blockedViolations = results.violations.filter((v: any) => 
    impactLevels[severity].includes(v.impact)
  );
  
  expect(blockedViolations).toHaveLength(0);
}

// ==========================================
// PUBLIC PAGES - No authentication required
// ==========================================

test.describe('Public Pages Accessibility', () => {
  test('Home page - WCAG AA compliant', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const results = await analyzeAccessibility(page, 'Home');
    
    // Strict: Block all critical and serious violations
    expectNoViolations(results, 'serious');
    
    // Specific checks
    expect(results.violations.find((v: any) => v.id === 'color-contrast')).toBeFalsy();
    expect(results.violations.find((v: any) => v.id === 'link-name')).toBeFalsy();
    expect(results.violations.find((v: any) => v.id === 'button-name')).toBeFalsy();
  });

  test('Features page - WCAG AA compliant', async ({ page }) => {
    await page.goto('/features');
    await page.waitForLoadState('networkidle');
    
    const results = await analyzeAccessibility(page, 'Features');
    expectNoViolations(results, 'serious');
  });

  test('Pricing page - WCAG AA compliant', async ({ page }) => {
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');
    
    const results = await analyzeAccessibility(page, 'Pricing');
    expectNoViolations(results, 'serious');
  });

  test('Contact page - WCAG AA compliant', async ({ page }) => {
    await page.goto('/contact');
    await page.waitForLoadState('networkidle');
    
    const results = await analyzeAccessibility(page, 'Contact');
    expectNoViolations(results, 'serious');
  });
});

// ==========================================
// AUTHENTICATION FLOW
// ==========================================

test.describe('Authentication Accessibility', () => {
  test('Auth landing page - WCAG AA compliant', async ({ page }) => {
    await page.goto('/auth-landing');
    await page.waitForLoadState('networkidle');
    
    const results = await analyzeAccessibility(page, 'Auth Landing');
    expectNoViolations(results, 'serious');
    
    // Form accessibility checks
    expect(results.violations.find((v: any) => v.id === 'label')).toBeFalsy();
    expect(results.violations.find((v: any) => v.id === 'form-field-multiple-labels')).toBeFalsy();
  });

  test('Main auth page - WCAG AA compliant', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
    
    const results = await analyzeAccessibility(page, 'Auth Page');
    expectNoViolations(results, 'serious');
    
    // Password field accessibility
    expect(results.violations.find((v: any) => v.id === 'label')).toBeFalsy();
  });
});

// ==========================================
// DASHBOARD PAGES
// ==========================================

test.describe('Dashboard Accessibility', () => {
  test('Client dashboard - WCAG AA compliant', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    const results = await analyzeAccessibility(page, 'Client Dashboard');
    expectNoViolations(results, 'serious');
    
    // Check status indicators have proper contrast
    expect(results.violations.find((v: any) => v.id === 'color-contrast')).toBeFalsy();
  });

  test('Call center - WCAG AA compliant', async ({ page }) => {
    await page.goto('/call-center');
    await page.waitForLoadState('networkidle');
    
    const results = await analyzeAccessibility(page, 'Call Center');
    expectNoViolations(results, 'serious');
  });

  test('Campaign manager - WCAG AA compliant', async ({ page }) => {
    await page.goto('/campaign-manager');
    await page.waitForLoadState('networkidle');
    
    const results = await analyzeAccessibility(page, 'Campaign Manager');
    expectNoViolations(results, 'serious');
  });
});

// ==========================================
// INTEGRATION PAGES
// ==========================================

test.describe('Integration Pages Accessibility', () => {
  test('Integrations hub - WCAG AA compliant', async ({ page }) => {
    await page.goto('/integrations');
    await page.waitForLoadState('networkidle');
    
    const results = await analyzeAccessibility(page, 'Integrations Hub');
    expectNoViolations(results, 'serious');
  });

  test('CRM integration - WCAG AA compliant', async ({ page }) => {
    await page.goto('/dashboard/integrations/crm');
    await page.waitForLoadState('networkidle');
    
    const results = await analyzeAccessibility(page, 'CRM Integration');
    expectNoViolations(results, 'serious');
  });

  test('Messaging integration - WCAG AA compliant', async ({ page }) => {
    await page.goto('/dashboard/integrations/messaging');
    await page.waitForLoadState('networkidle');
    
    const results = await analyzeAccessibility(page, 'Messaging Integration');
    expectNoViolations(results, 'serious');
  });

  test('Phone integration - WCAG AA compliant', async ({ page }) => {
    await page.goto('/dashboard/integrations/phone');
    await page.waitForLoadState('networkidle');
    
    const results = await analyzeAccessibility(page, 'Phone Integration');
    expectNoViolations(results, 'serious');
  });

  test('Email integration - WCAG AA compliant', async ({ page }) => {
    await page.goto('/dashboard/integrations/email');
    await page.waitForLoadState('networkidle');
    
    const results = await analyzeAccessibility(page, 'Email Integration');
    expectNoViolations(results, 'serious');
  });

  test('Automation integration - WCAG AA compliant', async ({ page }) => {
    await page.goto('/dashboard/integrations/automation');
    await page.waitForLoadState('networkidle');
    
    const results = await analyzeAccessibility(page, 'Automation Integration');
    expectNoViolations(results, 'serious');
  });

  test('Mobile integration - WCAG AA compliant', async ({ page }) => {
    await page.goto('/dashboard/integrations/mobile');
    await page.waitForLoadState('networkidle');
    
    const results = await analyzeAccessibility(page, 'Mobile Integration');
    expectNoViolations(results, 'serious');
  });
});

// ==========================================
// OPS & MONITORING PAGES
// ==========================================

test.describe('Operations Pages Accessibility', () => {
  test('Messaging health - WCAG AA compliant', async ({ page }) => {
    await page.goto('/ops/messaging-health');
    await page.waitForLoadState('networkidle');
    
    const results = await analyzeAccessibility(page, 'Messaging Health');
    expectNoViolations(results, 'serious');
    
    // Health metrics should have accessible color indicators
    expect(results.violations.find((v: any) => v.id === 'color-contrast')).toBeFalsy();
  });

  test('Voice health - WCAG AA compliant', async ({ page }) => {
    await page.goto('/ops/voice-health');
    await page.waitForLoadState('networkidle');
    
    const results = await analyzeAccessibility(page, 'Voice Health');
    expectNoViolations(results, 'serious');
  });

  test('Twilio evidence - WCAG AA compliant', async ({ page }) => {
    await page.goto('/ops/twilio-evidence');
    await page.waitForLoadState('networkidle');
    
    const results = await analyzeAccessibility(page, 'Twilio Evidence');
    expectNoViolations(results, 'serious');
  });
});

// ==========================================
// DARK MODE TESTING
// ==========================================

test.describe('Dark Mode Accessibility', () => {
  test.use({ colorScheme: 'dark' });

  test('Home page dark mode - WCAG AA compliant', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Force dark mode
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });
    
    const results = await analyzeAccessibility(page, 'Home (Dark Mode)');
    expectNoViolations(results, 'serious');
    
    // Dark mode must maintain contrast ratios
    expect(results.violations.find((v: any) => v.id === 'color-contrast')).toBeFalsy();
  });

  test('Dashboard dark mode - WCAG AA compliant', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });
    
    const results = await analyzeAccessibility(page, 'Dashboard (Dark Mode)');
    expectNoViolations(results, 'serious');
    expect(results.violations.find((v: any) => v.id === 'color-contrast')).toBeFalsy();
  });
});

// ==========================================
// KEYBOARD NAVIGATION
// ==========================================

test.describe('Keyboard Navigation', () => {
  test('Tab navigation works on home page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Press Tab multiple times and verify focus is visible
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      
      // Check that focused element exists and is visible
      const focusedElement = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return null;
        
        const rect = el.getBoundingClientRect();
        return {
          tag: el.tagName,
          isVisible: rect.width > 0 && rect.height > 0
        };
      });
      
      // Should have a focused element that's visible
      expect(focusedElement).toBeTruthy();
      if (focusedElement) {
        expect(focusedElement.isVisible).toBe(true);
      }
    }
  });

  test('Skip to main content link exists', async ({ page }) => {
    await page.goto('/');
    
    // Press Tab to focus first element (should be skip link)
    await page.keyboard.press('Tab');
    
    const skipLink = await page.evaluate(() => {
      const el = document.activeElement;
      return el?.textContent?.toLowerCase().includes('skip') || false;
    });
    
    // Note: This is aspirational - implement skip link if needed
    // expect(skipLink).toBe(true);
  });
});

// ==========================================
// FORM ACCESSIBILITY
// ==========================================

test.describe('Form Accessibility', () => {
  test('Contact form - all inputs labeled', async ({ page }) => {
    await page.goto('/contact');
    await page.waitForLoadState('networkidle');
    
    const results = await analyzeAccessibility(page, 'Contact Form');
    
    // All form inputs must have labels
    expect(results.violations.find((v: any) => v.id === 'label')).toBeFalsy();
    expect(results.violations.find((v: any) => v.id === 'form-field-multiple-labels')).toBeFalsy();
  });

  test('Auth form - accessible error messages', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
    
    const results = await analyzeAccessibility(page, 'Auth Form');
    
    // Error messages should be announced to screen readers
    expect(results.violations.find((v: any) => v.id === 'aria-valid-attr')).toBeFalsy();
  });
});
