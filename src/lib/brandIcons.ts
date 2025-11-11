/**
 * Centralized Brand Icons
 * 
 * Provides idempotent access to brand assets across the application.
 * All brand icons are sourced from a single source of truth.
 * 
 * Idempotency: Safe to import/use multiple times without side effects.
 */

/**
 * Startup splash robot icon path
 * Used in: StartupSplash, Chatbox, and other UI components
 */
export const ROBOT_ICON_PATH = '/assets/brand/TRADELEINE_ROBOT_V2.svg';

/**
 * Official logo path
 * Used in: Headers, footers, hero sections
 */
export const OFFICIAL_LOGO_PATH = '/assets/official-logo.png';

/**
 * Brand icon paths mapped by usage context
 */
export const BrandIcons = {
  /** Robot icon from startup splash - used for chat, AI assistant, etc. */
  robot: ROBOT_ICON_PATH,
  /** Official logo - used for branding */
  logo: OFFICIAL_LOGO_PATH,
  /** Chat icon - aliased to robot for consistency */
  chat: ROBOT_ICON_PATH,
  /** Assistant icon - aliased to robot */
  assistant: ROBOT_ICON_PATH,
} as const;

/**
 * Get brand icon path by key
 * @param key - Icon identifier
 * @returns Icon path or undefined if not found
 */
export const getBrandIcon = (key: keyof typeof BrandIcons): string => {
  return BrandIcons[key] || ROBOT_ICON_PATH; // Default fallback to robot
};

/**
 * Type-safe brand icon keys
 */
export type BrandIconKey = keyof typeof BrandIcons;

