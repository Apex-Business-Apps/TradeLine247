/**
 * Centralized overlay opacity tokens for consistent visual design
 * 
 * These values define the standard overlay opacity levels used across
 * the application for hero sections and other content sections.
 */

export const OVERLAY = {
  /**
   * Hero section overlay - 20% opacity (reduced for better background visibility)
   * Applied to hero sections to maintain readability while showing background
   */
  hero: "hsl(var(--brand-orange-primary) / 0.2)",
  
  /**
   * Non-hero section overlay - 30% opacity (reduced for better background visibility)
   * Applied to landing page sections (excluding hero) for consistent darkening
   */
  section: "hsl(var(--brand-orange-primary) / 0.3)",
} as const;
