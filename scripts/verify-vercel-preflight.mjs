#!/usr/bin/env node

/**
* scripts/verify-vercel-preflight.mjs
* - runs npm ci
* - runs npm run build
* - checks for dist/index.html
* - prints concise logs
*/

import { spawnSync } from 'child_process';
import fs from 'fs';

function run(cmd, args, opts={}) {
const res = spawnSync(cmd, args, { stdio: 'inherit', shell: false, ...opts });
if (res.error || res.status !== 0) {
  throw new Error(`${cmd} ${args.join(' ')} failed with status ${res.status}`);
}
return res;
}

try {
console.log('[preflight] npm ci');
run('npm', ['ci', '--no-audit', '--fund=false']);

console.log('[preflight] npm run build');
run('npm', ['run', 'build']);

if (!fs.existsSync('dist/index.html')) {
  throw new Error('dist/index.html not found after build');
}

console.log('[preflight] OK — build produced dist/index.html');
process.exit(0);
} catch (err) {
console.error('[preflight] ERROR:', err.message || err);
process.exit(1);
}
