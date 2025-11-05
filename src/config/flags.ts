/**
 * Conversion V1 Feature Flags
 * 
 * Feature toggles for conversion-focused onboarding improvements.
 * Can be disabled via environment variable: VITE_FLAG_CONVERSION_V1=false
 */

export const flags = {
  conversionV1: (import.meta.env.VITE_FLAG_CONVERSION_V1 ?? 'true') === 'true',
} as const;

