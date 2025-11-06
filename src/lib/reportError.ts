/**
 * DEPRECATED: Use errorReporter from '@/lib/errorReporter' instead
 * This file exists only for backward compatibility during migration
 * @deprecated
 */

import { errorReporter } from './errorReporter';

export async function reportError(err: unknown, orgId?: string) {
  errorReporter.report({
    type: 'error',
    message: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined,
    timestamp: new Date().toISOString(),
    url: typeof window !== 'undefined' ? window.location.href : '',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    environment: errorReporter['getEnvironment'](),
    metadata: { orgId }
  });
}
