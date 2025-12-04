/**
 * Background System with Healthchecks v1.0.0
 * 2025-12-03 | TradeLine 24/7
 */

type HealthStatus = 'PASS' | 'WARN' | 'FAIL' | 'SKIP';

interface HealthCheck {
  name: string;
  status: HealthStatus;
  message: string;
  evidence?: string;
}

interface HealthReport {
  overall: HealthStatus;
  score: number;
  maxScore: number;
  checks: HealthCheck[];
  timestamp: string;
}

// === CORE FUNCTIONS ===

export function setViewportHeight(): void {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh-safe', `${vh * 100}px`);
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}

export function applyPlatformClasses(): void {
  const html = document.documentElement;
  const ua = navigator.userAgent;

  html.classList.remove('is-ios', 'is-android', 'is-mobile', 'is-tablet');

  if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
    html.classList.add('is-ios');
  }
  if (/Android/.test(ua)) html.classList.add('is-android');
  if (/Mobile|Android|iPhone/.test(ua)) html.classList.add('is-mobile');
  if (/iPad|Android(?!.*Mobile)/.test(ua)) html.classList.add('is-tablet');
}

// === HEALTH CHECKS ===

function checkElementExists(): HealthCheck {
  const el = document.querySelector('.hero-bg');
  return {
    name: 'Element Exists',
    status: el ? 'PASS' : 'FAIL',
    message: el ? '.hero-bg found' : '.hero-bg NOT FOUND',
    evidence: el ? `Tag: ${el.tagName}, Classes: ${el.className}` : 'null'
  };
}

function checkBackgroundAttachment(): HealthCheck {
  const el = document.querySelector('.hero-bg') as HTMLElement;
  if (!el) return { name: 'Background Attachment', status: 'SKIP', message: 'Element missing' };

  const attachment = getComputedStyle(el).backgroundAttachment;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  if (isIOS && attachment === 'fixed') {
    return { name: 'Background Attachment', status: 'FAIL', message: 'CRITICAL: fixed on iOS', evidence: attachment };
  }
  return { name: 'Background Attachment', status: 'PASS', message: attachment, evidence: attachment };
}

function checkViewportCoverage(): HealthCheck {
  const el = document.querySelector('.hero-bg') as HTMLElement;
  if (!el) return { name: 'Viewport Coverage', status: 'SKIP', message: 'Element missing' };

  const rect = el.getBoundingClientRect();
  const coverage = (rect.height / window.innerHeight) * 100;

  if (coverage < 90) {
    return { name: 'Viewport Coverage', status: 'FAIL', message: `${coverage.toFixed(0)}% (<90%)`, evidence: `${rect.height}px / ${window.innerHeight}px` };
  }
  return { name: 'Viewport Coverage', status: 'PASS', message: `${coverage.toFixed(0)}%`, evidence: `${rect.height}px / ${window.innerHeight}px` };
}

function checkVhSafe(): HealthCheck {
  const value = getComputedStyle(document.documentElement).getPropertyValue('--vh-safe').trim();
  if (!value) {
    return { name: 'CSS --vh-safe', status: 'WARN', message: 'Not set (JS may not have run)', evidence: 'undefined' };
  }
  return { name: 'CSS --vh-safe', status: 'PASS', message: value, evidence: value };
}

function checkHorizontalOverflow(): HealthCheck {
  const overflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;
  if (overflow > 0) {
    return { name: 'Horizontal Overflow', status: 'FAIL', message: `${overflow}px overflow`, evidence: `scrollWidth: ${document.documentElement.scrollWidth}` };
  }
  return { name: 'Horizontal Overflow', status: 'PASS', message: 'None', evidence: '0px' };
}

export function runHealthChecks(): HealthReport {
  const checks = [
    checkElementExists(),
    checkBackgroundAttachment(),
    checkViewportCoverage(),
    checkVhSafe(),
    checkHorizontalOverflow()
  ];

  const score = checks.filter(c => c.status === 'PASS').length * 2; // 2 points each = 10 max
  const maxScore = 10;

  let overall: HealthStatus = 'PASS';
  if (checks.some(c => c.status === 'FAIL')) overall = 'FAIL';
  else if (checks.some(c => c.status === 'WARN')) overall = 'WARN';

  return { overall, score, maxScore, checks, timestamp: new Date().toISOString() };
}

export function logHealthReport(report: HealthReport): void {
  console.group(`🏥 Health Check: ${report.score}/${report.maxScore} (${report.overall})`);
  report.checks.forEach(c => {
    const icon = { PASS: '✅', WARN: '⚠️', FAIL: '❌', SKIP: '⏭️' }[c.status];
    console.log(`${icon} ${c.name}: ${c.message}`);
    if (c.evidence) console.log(`   Evidence: ${c.evidence}`);
  });
  console.groupEnd();
}

// === SELF-HEALING ===

export function attemptSelfHeal(): string[] {
  const healed: string[] = [];

  if (!getComputedStyle(document.documentElement).getPropertyValue('--vh-safe').trim()) {
    setViewportHeight();
    healed.push('--vh-safe');
  }

  const ua = navigator.userAgent;
  const html = document.documentElement;

  if (/iPad|iPhone|iPod/.test(ua) && !html.classList.contains('is-ios')) {
    html.classList.add('is-ios');
    healed.push('.is-ios');
  }

  return healed;
}

// === MAIN INIT ===

export function initBackgroundSystem(): () => void {
  setViewportHeight();
  applyPlatformClasses();

  const debounce = (fn: () => void, ms: number) => {
    let timeout: ReturnType<typeof setTimeout>;
    return () => { clearTimeout(timeout); timeout = setTimeout(fn, ms); };
  };

  const debouncedSet = debounce(setViewportHeight, 100);
  window.addEventListener('resize', debouncedSet, { passive: true });

  const handleOrientation = () => setTimeout(setViewportHeight, 100);
  window.addEventListener('orientationchange', handleOrientation, { passive: true });

  // Initial health check
  setTimeout(() => {
    const report = runHealthChecks();
    logHealthReport(report);
    if (report.overall !== 'PASS') attemptSelfHeal();
  }, 1000);

  return () => {
    window.removeEventListener('resize', debouncedSet);
    window.removeEventListener('orientationchange', handleOrientation);
  };
}

export default initBackgroundSystem;
