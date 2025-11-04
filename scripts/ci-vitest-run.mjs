#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

process.env.CI ||= '1';

if (!process.stdout.columns) process.stdout.columns = 80;
if (!process.stderr.columns) process.stderr.columns = 80;

const result = spawnSync('npx', ['vitest', 'run'], { stdio: 'inherit' });
process.exit(result.status ?? 1);
