#!/usr/bin/env node
/**
 * smoke-urls.mjs
 *
 * Smoke test script that validates critical URLs are accessible and contain expected content.
 *
 * Usage:
 *   node scripts/smoke-urls.mjs [base-url]
 *
 * Example:
 *   node scripts/smoke-urls.mjs http://localhost:8080
 *
 * Exit codes:
 *   0 - All tests passed
 *   1 - One or more tests failed
 */

import { spawn } from 'node:child_process';
import { setTimeout } from 'node:timers/promises';

const BASE_URL = process.argv[2] || 'http://localhost:8080';
const TIMEOUT_MS = 30000; // 30 seconds timeout for server startup
const CHECK_INTERVAL_MS = 1000; // Check every 1 second

// Test cases: [path, expected content/regex, description]
const TESTS = [
  ['/pricing', /start free trial/i, 'Pricing page CTA'],
  ['/auth', /welcome to tradeline 24\/7/i, 'Auth page heading'],
  ['/', /tradeline 24\/7/i, 'Home page title'],
];

/**
 * Fetch a URL with timeout
 */
async function fetchWithTimeout(url, timeoutMs = 10000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    return response;
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}

/**
 * Check if server is ready
 */
async function waitForServer(baseUrl, timeoutMs = TIMEOUT_MS) {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetchWithTimeout(`${baseUrl}/`, 3000);
      if (response.ok) {
        console.log(`✓ Server ready at ${baseUrl}`);
        return true;
      }
    } catch (error) {
      // Server not ready yet, wait and retry
    }

    await setTimeout(CHECK_INTERVAL_MS);
  }

  throw new Error(`Server at ${baseUrl} not ready after ${timeoutMs}ms`);
}

/**
 * Run smoke test for a single URL
 */
async function testUrl(baseUrl, path, expectedContent, description) {
  const url = `${baseUrl}${path}`;

  try {
    console.log(`Testing: ${url}`);

    const response = await fetchWithTimeout(url, 10000);

    if (!response.ok) {
      console.error(`✗ ${description} - HTTP ${response.status}`);
      return false;
    }

    const body = await response.text();

    if (!body) {
      console.error(`✗ ${description} - Empty response body`);
      return false;
    }

    const matches = expectedContent instanceof RegExp
      ? expectedContent.test(body)
      : body.includes(expectedContent);

    if (!matches) {
      console.error(`✗ ${description} - Expected content not found`);
      console.error(`  Expected: ${expectedContent}`);
      console.error(`  Body length: ${body.length} characters`);
      return false;
    }

    console.log(`✓ ${description} - PASS`);
    return true;

  } catch (error) {
    console.error(`✗ ${description} - ${error.message}`);
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('='.repeat(60));
  console.log('TradeLine 24/7 - URL Smoke Tests');
  console.log('='.repeat(60));
  console.log(`Base URL: ${BASE_URL}\n`);

  try {
    // Wait for server to be ready
    await waitForServer(BASE_URL);
    console.log('');

    // Run all tests
    const results = await Promise.all(
      TESTS.map(([path, expected, desc]) => testUrl(BASE_URL, path, expected, desc))
    );

    console.log('');
    console.log('='.repeat(60));

    const passed = results.filter(Boolean).length;
    const total = results.length;

    if (passed === total) {
      console.log(`✓ All ${total} tests PASSED`);
      console.log('='.repeat(60));
      process.exit(0);
    } else {
      console.error(`✗ ${total - passed} of ${total} tests FAILED`);
      console.log('='.repeat(60));
      process.exit(1);
    }

  } catch (error) {
    console.error('\n✗ FATAL ERROR:', error.message);
    console.log('='.repeat(60));
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { testUrl, waitForServer };
