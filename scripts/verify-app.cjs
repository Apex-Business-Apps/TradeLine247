#!/usr/bin/env node
// Verify built SPA by running 'vite preview' and probing '/'. No TS/server imports.
const { spawn } = require('node:child_process');
const { setTimeout: delay } = require('node:timers/promises');

const HOST = '127.0.0.1';
const PORT = Number(process.env.VERIFY_PORT || 4173);
const ORIGIN = `http://${HOST}:${PORT}`;
const PATH = process.env.VERIFY_PATH || '/';
const TIMEOUT_MS = Number(process.env.VERIFY_TIMEOUT_MS || 15000);

const exe = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const preview = spawn(exe, ['vite', 'preview', '--host', HOST, '--port', String(PORT)], {
  stdio: ['ignore', 'pipe', 'pipe'],
  env: { ...process.env, NODE_ENV: 'production' },
});
let exited = false;
preview.on('exit', c => (exited = true));
preview.stdout.on('data', d => process.stdout.write(String(d)));
preview.stderr.on('data', d => process.stderr.write(String(d)));

async function probe() {
  const end = Date.now() + TIMEOUT_MS;
  let lastErr = null;
  while (Date.now() < end) {
    if (exited) throw new Error('vite preview exited before ready');
    try {
      const r = await fetch(ORIGIN + PATH, { redirect: 'manual' });
      if (r.ok || (r.status >= 300 && r.status < 400)) return;
      lastErr = new Error(`unexpected status ${r.status}`);
    } catch (e) { lastErr = e; }
    await delay(300);
  }
  throw lastErr ?? new Error('timeout');
}

(async () => {
  try {
    console.log(`Node.js ${process.version}`);
    console.log(`[verify] Probing ${ORIGIN}${PATH}`);
    await probe();
    console.log('VERIFY: PASS');
    preview.kill('SIGTERM'); process.exit(0);
  } catch (e) {
    console.error('VERIFY: FAIL'); console.error(e?.stack || e);
    try { preview.kill('SIGTERM'); } catch {}
    process.exit(1);
  }
})();
