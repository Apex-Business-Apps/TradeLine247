/**
 * Status Colors Helper Utility
 *
 * Provides consistent color classes for status indicators, sentiment analysis,
 * trends, and connection quality across the application.
 *
 * All colors are WCAG 2 AA compliant and use design system tokens.
 *
 * @see /BRAND_COLORS.md for complete color system documentation
 * @see /src/index.css for design token definitions
 */

export type StatusType = 'success' | 'warning' | 'error' | 'info';
export type ColorProperty = 'bg' | 'border' | 'text' | 'icon';
export type SentimentType = 'positive' | 'negative' | 'neutral';
export type TrendType = 'up' | 'down' | 'neutral';
export type ConnectionType = 'excellent' | 'good' | 'slow' | 'offline';

/**
 * Status color classes using design system tokens
 * WCAG 2 AA compliant (4.5:1 for normal text, 3:1 for large text)
 */
export const StatusColors = {
  success: {
    bg: 'bg-[hsl(var(--status-success-bg))]',
    border: 'border-[hsl(var(--status-success))]',
    text: 'text-[hsl(var(--status-success))] dark:text-[hsl(var(--status-success-light))]',
    icon: 'text-[hsl(var(--status-success))]',
  },
  warning: {
    bg: 'bg-[hsl(var(--status-warning-bg))]',
    border: 'border-[hsl(var(--status-warning))]',
    text: 'text-[hsl(var(--status-warning))] dark:text-[hsl(var(--status-warning-light))]',
    icon: 'text-[hsl(var(--status-warning))]',
  },
  error: {
    bg: 'bg-[hsl(var(--status-error-bg))]',
    border: 'border-[hsl(var(--status-error))]',
    text: 'text-[hsl(var(--status-error))] dark:text-[hsl(var(--status-error-light))]',
    icon: 'text-[hsl(var(--status-error))]',
  },
  info: {
    bg: 'bg-[hsl(var(--status-info-bg))]',
    border: 'border-[hsl(var(--status-info))]',
    text: 'text-[hsl(var(--status-info))] dark:text-[hsl(var(--status-info-light))]',
    icon: 'text-[hsl(var(--status-info))]',
  },
} as const;

/**
 * Sentiment color classes for call analysis and transcripts
 */
export const SentimentColors = {
  positive: {
    bg: 'bg-[hsl(var(--status-success-bg))]',
    border: 'border-[hsl(var(--sentiment-positive))]',
    text: 'text-[hsl(var(--sentiment-positive))] dark:text-[hsl(var(--status-success-light))]',
    icon: 'text-[hsl(var(--sentiment-positive))]',
  },
  negative: {
    bg: 'bg-[hsl(var(--status-error-bg))]',
    border: 'border-[hsl(var(--sentiment-negative))]',
    text: 'text-[hsl(var(--sentiment-negative))] dark:text-[hsl(var(--status-error-light))]',
    icon: 'text-[hsl(var(--sentiment-negative))]',
  },
  neutral: {
    bg: 'bg-muted',
    border: 'border-muted',
    text: 'text-muted-foreground',
    icon: 'text-muted-foreground',
  },
} as const;

/**
 * Trend indicator color classes for metrics and KPIs
 */
export const TrendColors = {
  up: {
    bg: 'bg-[hsl(var(--status-success-bg))]',
    border: 'border-[hsl(var(--trend-up))]',
    text: 'text-[hsl(var(--trend-up))] dark:text-[hsl(var(--status-success-light))]',
    icon: 'text-[hsl(var(--trend-up))]',
  },
  down: {
    bg: 'bg-[hsl(var(--status-error-bg))]',
    border: 'border-[hsl(var(--trend-down))]',
    text: 'text-[hsl(var(--trend-down))] dark:text-[hsl(var(--status-error-light))]',
    icon: 'text-[hsl(var(--trend-down))]',
  },
  neutral: {
    bg: 'bg-muted',
    border: 'border-muted',
    text: 'text-muted-foreground',
    icon: 'text-muted-foreground',
  },
} as const;

/**
 * Connection quality color classes for real-time indicators
 */
export const ConnectionColors = {
  excellent: {
    bg: 'bg-[hsl(var(--status-success-bg))]',
    border: 'border-[hsl(var(--connection-excellent))]',
    text: 'text-[hsl(var(--connection-excellent))] dark:text-[hsl(var(--status-success-light))]',
    icon: 'text-[hsl(var(--connection-excellent))]',
  },
  good: {
    bg: 'bg-[hsl(var(--status-info-bg))]',
    border: 'border-[hsl(var(--connection-good))]',
    text: 'text-[hsl(var(--connection-good))] dark:text-[hsl(var(--status-info-light))]',
    icon: 'text-[hsl(var(--connection-good))]',
  },
  slow: {
    bg: 'bg-[hsl(var(--status-warning-bg))]',
    border: 'border-[hsl(var(--connection-slow))]',
    text: 'text-[hsl(var(--connection-slow))] dark:text-[hsl(var(--status-warning-light))]',
    icon: 'text-[hsl(var(--connection-slow))]',
  },
  offline: {
    bg: 'bg-[hsl(var(--status-error-bg))]',
    border: 'border-[hsl(var(--connection-offline))]',
    text: 'text-[hsl(var(--connection-offline))] dark:text-[hsl(var(--status-error-light))]',
    icon: 'text-[hsl(var(--connection-offline))]',
  },
} as const;

/**
 * Get status color class dynamically
 * @param status - The status type
 * @param property - The color property to retrieve
 * @returns Tailwind CSS class string
 *
 * @example
 * getStatusColorClass('success', 'text') // Returns WCAG AA compliant green text class
 * getStatusColorClass('error', 'bg') // Returns error background class
 */
export function getStatusColorClass(status: StatusType, property: ColorProperty): string {
  return StatusColors[status][property];
}

/**
 * Get sentiment color class dynamically
 * @param sentiment - The sentiment type
 * @param property - The color property to retrieve
 * @returns Tailwind CSS class string
 */
export function getSentimentColorClass(sentiment: SentimentType, property: ColorProperty): string {
  return SentimentColors[sentiment][property];
}

/**
 * Get trend color class dynamically
 * @param trend - The trend type
 * @param property - The color property to retrieve
 * @returns Tailwind CSS class string
 */
export function getTrendColorClass(trend: TrendType, property: ColorProperty): string {
  return TrendColors[trend][property];
}

/**
 * Get connection quality color class dynamically
 * @param connection - The connection quality type
 * @param property - The color property to retrieve
 * @returns Tailwind CSS class string
 */
export function getConnectionColorClass(connection: ConnectionType, property: ColorProperty): string {
  return ConnectionColors[connection][property];
}

/**
 * Migration helper: Map old hardcoded Tailwind colors to new design system tokens
 * @deprecated Use design system tokens directly instead
 */
export const ColorMigrationMap = {
  // Old hardcoded green → New success token
  'text-success': 'text-[hsl(var(--status-success))]',
  'text-green-400': 'text-[hsl(var(--status-success-light))]',
  'bg-green-50': 'bg-[hsl(var(--status-success-bg))]',
  'bg-green-100': 'bg-[hsl(var(--status-success-bg))]',
  'bg-green-500': 'bg-[hsl(var(--status-success))]',
  'border-green-500': 'border-[hsl(var(--status-success))]',

  // Old hardcoded amber/yellow → New warning token
  'text-amber-800': 'text-[hsl(var(--status-warning))]',
  'text-yellow-400': 'text-[hsl(var(--status-warning-light))]',
  'text-yellow-500': 'text-[hsl(var(--status-warning))]',
  'bg-yellow-50': 'bg-[hsl(var(--status-warning-bg))]',
  'bg-amber-600': 'bg-[hsl(var(--status-warning))]',
  'border-yellow-200': 'border-[hsl(var(--status-warning))]',

  // Old hardcoded red → New error token
  'text-red-700': 'text-[hsl(var(--status-error))]',
  'text-error': 'text-[hsl(var(--status-error))]',
  'text-red-400': 'text-[hsl(var(--status-error-light))]',
  'bg-red-50': 'bg-[hsl(var(--status-error-bg))]',
  'bg-red-700': 'bg-[hsl(var(--status-error))]',
  'border-red-200': 'border-[hsl(var(--status-error))]',

  // Old hardcoded blue → New info token
  'text-info': 'text-[hsl(var(--status-info))]',
  'text-blue-400': 'text-[hsl(var(--status-info-light))]',
  'bg-blue-50': 'bg-[hsl(var(--status-info-bg))]',
  'bg-blue-500': 'bg-[hsl(var(--status-info))]',
  'border-blue-200': 'border-[hsl(var(--status-info))]',
} as const;

/**
 * Usage Examples:
 *
 * ```tsx
 * import { StatusColors, getStatusColorClass } from '@/components/ui/status-colors';
 *
 * // Static usage
 * <div className={StatusColors.success.bg}>Success background</div>
 * <span className={StatusColors.error.text}>Error text</span>
 *
 * // Dynamic usage
 * const status: StatusType = 'warning';
 * <div className={getStatusColorClass(status, 'bg')}>
 *   <span className={getStatusColorClass(status, 'text')}>Warning</span>
 * </div>
 *
 * // Sentiment analysis
 * import { SentimentColors, getSentimentColorClass } from '@/components/ui/status-colors';
 * <div className={SentimentColors.positive.bg}>
 *   <span className={SentimentColors.positive.text}>Positive sentiment</span>
 * </div>
 *
 * // Trend indicators
 * import { TrendColors } from '@/components/ui/status-colors';
 * <div className={TrendColors.up.text}>
 *   <TrendingUp className={TrendColors.up.icon} />
 *   +5.2%
 * </div>
 *
 * // Connection quality
 * import { ConnectionColors } from '@/components/ui/status-colors';
 * <div className={ConnectionColors.excellent.bg}>
 *   <span className={ConnectionColors.excellent.text}>Connected</span>
 * </div>
 * ```
 */
