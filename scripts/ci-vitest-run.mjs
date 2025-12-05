#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

process.env.CI ||= '1';

if (!process.stdout.columns) process.stdout.columns = 80;
if (!process.stderr.columns) process.stderr.columns = 80;

// Use shell: true on Windows to find npx.cmd
const isWindows = process.platform === 'win32';
const result = spawnSync('npx', ['vitest', 'run'], { 
  stdio: 'inherit',
  shell: isWindows,
});
process.exit(result.status ?? 1);
