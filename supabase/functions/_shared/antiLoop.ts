import { normalizeToE164, isValidE164 } from './e164.ts';

function normalizeSafe(num?: string | null): string | null {
  if (!num) return null;
  try {
    return normalizeToE164(num);
  } catch {
    return isValidE164(num) ? num : null;
  }
}

/**
 * Build internal number set from environment.
 * Accepts OWNER_ADMIN_E164 (required upstream), OPS_NUMBER, BUSINESS_TARGET_E164,
 * and INTERNAL_E164S (comma separated).
 */
export function buildInternalNumberSet(env: Record<string, string | undefined>): Set<string> {
  const numbers: string[] = [];
  const maybeAdd = (value?: string | null) => {
    const normalized = normalizeSafe(value);
    if (normalized) numbers.push(normalized);
  };

  maybeAdd(env['OWNER_ADMIN_E164']);
  maybeAdd(env['OPS_NUMBER']);
  maybeAdd(env['BUSINESS_TARGET_E164']);

  const internalList = env['INTERNAL_E164S'];
  if (internalList) {
    for (const entry of internalList.split(',')) {
      maybeAdd(entry.trim());
    }
  }

  return new Set(numbers);
}

/**
 * Returns a dialable E.164 target or empty string if blocked.
 */
export function safeDialTarget(
  target: string | undefined,
  from: string,
  to: string,
  internalSet: Set<string>
): string {
  const targetNorm = normalizeSafe(target);
  const fromNorm = normalizeSafe(from) || from;
  const toNorm = normalizeSafe(to) || to;

  if (!targetNorm) return '';
  if (fromNorm && targetNorm === fromNorm) return '';
  if (toNorm && targetNorm === toNorm) return '';
  if (internalSet.has(targetNorm)) return '';

  return targetNorm;
}

export function isInternalCaller(from: string, internalSet: Set<string>): boolean {
  const fromNorm = normalizeSafe(from);
  return !!(fromNorm && internalSet.has(fromNorm));
}

