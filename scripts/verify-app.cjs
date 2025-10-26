#!/usr/bin/env node
/**
 * verify-app.cjs
 * Purpose: Verify the built SPA is servable without importing any TS/Node server code.
 * Strategy: Run "vite preview" on port 4173, poll GET / until 200, then exit 0.
 * No external deps. Node 18+ fetch is available.
 */

const { spawn } = require('node:child_process');
const { setTimeout: delay } = require('node:timers/promises');

const PORT = Number(process.env.VERIFY_PORT || 4173);
const HOST = '127.0.0.1';
const ORIGIN = `http://${HOST}:${PORT}`;
const PATH = process.env.VERIFY_PATH || '/'; // we only need index for SPA

// Spawn vite preview to serve dist without touching server TS files.
const preview = spawn(process.platform === 'win32' ? 'npx.cmd' : 'npx', [
  'vite',
  'preview',
  '--host',
  HOST,
  '--port',
  String(PORT),
], {
  stdio: ['ignore', 'pipe', 'pipe'],
  env: {
    ...process.env,
    // defensive: some CI envs set odd values that break preview
    NODE_ENV: 'production',
  },
});

let previewExited = false;
preview.on('exit', (code, signal) => {
  previewExited = true;
  if (code !== 0) {
    console.error(`[verify] vite preview exited early code=${code} signal=${signal}`);
  }
});

// Pipe output for debugging, but keep noise low
preview.stdout.on('data', (d) => process.stdout.write(String(d)));
preview.stderr.on('data', (d) => process.stderr.write(String(d)));

async function pollReady(timeoutMs = 15000, intervalMs = 300) {
  const deadline = Date.now() + timeoutMs;
  let lastErr = null;
  while (Date.now() < deadline) {
    if (previewExited) {
      throw new Error('vite preview exited before ready');
    }
    try {
      const res = await fetch(ORIGIN + PATH, { redirect: 'manual' });
      if (res.ok || (res.status >= 300 && res.status < 400)) {
        return true;
      }
      lastErr = new Error(`unexpected status ${res.status}`);
    } catch (e) {
      lastErr = e;
    }
    await delay(intervalMs);
  }
  throw lastErr ?? new Error('timeout waiting for preview');
}

(async () => {
  try {
    console.log(`Node.js ${process.version}`);
    console.log(`[verify] Waiting for preview at ${ORIGIN}${PATH} ...`);
    await pollReady();
    console.log('VERIFY: PASS');
    preview.kill('SIGTERM');
    process.exit(0);
  } catch (e) {
    console.error('VERIFY: FAIL');
    console.error(e && e.stack || e);
    try { preview.kill('SIGTERM'); } catch {}
    process.exit(1);
  }
})();
