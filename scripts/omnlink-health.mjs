#!/usr/bin/env node
/**
 * Lightweight OMNiLiNK health probe (optional integration).
 * Usage: npm run omnlink:health
 */

function parseEnabled(val) {
  if (!val) return false;
  return ['1', 'true', 'yes', 'on'].includes(val.toLowerCase());
}

async function main() {
  const enabled = parseEnabled(process.env.OMNILINK_ENABLED);
  const baseUrl = process.env.OMNILINK_BASE_URL;
  const tenantId = process.env.OMNILINK_TENANT_ID;

  if (!enabled) {
    console.log(JSON.stringify({ status: 'disabled', message: 'OmniLink is disabled' }, null, 2));
    return;
  }

  const missing = [];
  if (!baseUrl) missing.push('OMNILINK_BASE_URL');
  if (!tenantId) missing.push('OMNILINK_TENANT_ID');

  if (missing.length) {
    console.log(JSON.stringify({ status: 'error', message: `Missing config: ${missing.join(', ')}` }, null, 2));
    return;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const resp = await fetch(`${baseUrl.replace(/\/$/, '')}/health`, { signal: controller.signal });
    clearTimeout(timeout);
    if (!resp.ok) {
      console.log(JSON.stringify({ status: 'error', message: `Health probe failed with status ${resp.status}` }, null, 2));
      return;
    }
    console.log(JSON.stringify({ status: 'ok' }, null, 2));
  } catch (error) {
    console.log(JSON.stringify({ status: 'error', message: `Health probe error: ${error.message}` }, null, 2));
  }
}

main();

