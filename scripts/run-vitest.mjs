import { spawn } from 'node:child_process';

const rawArgs = process.argv.slice(2);
const forwarded = [];
let hasReporter = false;

for (let i = 0; i < rawArgs.length; i += 1) {
  const arg = rawArgs[i];
  if (arg === '--ci') {
    continue;
  }
  if (arg === '--reporter') {
    hasReporter = true;
    forwarded.push(arg);
    if (i + 1 < rawArgs.length) {
      forwarded.push(rawArgs[i + 1]);
      i += 1;
    }
    continue;
  }
  if (arg.startsWith('--reporter=')) {
    hasReporter = true;
    forwarded.push(arg);
    continue;
  }
  if (arg.startsWith('--reporters=')) {
    hasReporter = true;
    const value = arg.split('=')[1];
    if (value) {
      forwarded.push('--reporter', value);
    }
    continue;
  }
  forwarded.push(arg);
}

const baseArgs = ['run'];
if (!hasReporter) {
  baseArgs.push('--reporter=dot');
}

const finalArgs = [...baseArgs, ...forwarded];

const child = spawn('npx', ['--no-install', 'vitest', ...finalArgs], {
  stdio: 'inherit',
  shell: false,
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  } else {
    process.exit(code ?? 1);
  }
});
