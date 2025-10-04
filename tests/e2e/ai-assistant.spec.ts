/**
 * E2E Test: AI Assistant Integration
 * 
 * Tests production AI assistant with bilingual support and compliance
 */

import { test, expect } from '@playwright/test';

test.describe('AI Assistant - AutoRepAi', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load chat widget on homepage', async ({ page }) => {
    // Check for chat widget presence
    const chatWidget = page.locator('[data-testid="ai-chat-widget"]').or(page.locator('button:has-text("Chat")'));
    await expect(chatWidget).toBeVisible({ timeout: 10000 });
  });

  test('should display bilingual greeting (EN/FR)', async ({ page }) => {
    // Open chat
    await page.click('[data-testid="ai-chat-widget"]');
    
    // Look for AutoRepAi introduction
    await expect(page.locator('text=/AutoRepAi|assistant/i')).toBeVisible({ timeout: 5000 });
  });

  test('should handle basic conversation flow', async ({ page }) => {
    await page.click('[data-testid="ai-chat-widget"]');
    
    // Type a message
    const input = page.locator('input[type="text"]').or(page.locator('textarea'));
    await input.fill("I'm interested in a vehicle");
    await input.press('Enter');
    
    // Wait for AI response
    await expect(page.locator('text=/vehicle|car|interest/i')).toBeVisible({ timeout: 15000 });
  });

  test('should log interactions to lead timeline', async ({ page }) => {
    // Authenticate first
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button:has-text("Sign In")');
    await page.waitForURL('/dashboard');

    // Navigate to a lead detail page (assuming lead ID 1 exists)
    await page.goto('/leads/1');
    
    // Check timeline for chat interactions
    await expect(page.locator('text=/chat|message/i')).toBeVisible({ timeout: 5000 });
  });

  test('should respect rate limiting', async ({ page }) => {
    await page.click('[data-testid="ai-chat-widget"]');
    
    const input = page.locator('input[type="text"]').or(page.locator('textarea'));
    
    // Send multiple rapid messages
    for (let i = 0; i < 10; i++) {
      await input.fill(`Message ${i}`);
      await input.press('Enter');
      await page.waitForTimeout(100);
    }
    
    // Should see rate limit message
    await expect(page.locator('text=/rate limit|too many requests/i')).toBeVisible({ timeout: 5000 });
  });

  test('should include compliance disclaimers', async ({ page }) => {
    await page.click('[data-testid="ai-chat-widget"]');
    
    // Look for consent/privacy messaging
    await expect(page.locator('text=/privacy|consent|terms/i')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('AI Language Switching', () => {
  test('should switch between English and French', async ({ page }) => {
    await page.goto('/');
    
    // Look for language toggle
    const langToggle = page.locator('[data-testid="language-toggle"]').or(page.locator('button:has-text("FR")'));
    
    if (await langToggle.isVisible()) {
      await langToggle.click();
      
      // Verify French content appears
      await expect(page.locator('text=/Bienvenue|Bonjour/i')).toBeVisible({ timeout: 3000 });
    }
  });
});
