import { CSSProperties } from "react";

/**
 * Creates a reusable background style that blends TradeLine's logo colors:
 * - Logo orange #FF6B35 (top) → Logo blue #68B6E9 (bottom)
 * - 45% opacity for internal pages + 23% white tint
 * - NOTE: Background image should be in a separate div with pointer-events: none
 *   This style is for gradient overlays only, not the background image itself
 */
export const createBrandGradientStyle = (image: string): CSSProperties => ({
  backgroundImage: `
    linear-gradient(to bottom, rgba(255, 255, 255, 0.25), rgba(255, 255, 255, 0.25)),
    linear-gradient(
      to bottom,
      rgba(255, 107, 53, 0.52) 0%,
      rgba(104, 182, 233, 0.52) 100%
    )
  `,
  backgroundSize: "auto, auto",
  backgroundPosition: "center, center",
  backgroundRepeat: "no-repeat, no-repeat",
  backgroundAttachment: "scroll, scroll",
  backgroundColor: "hsl(0, 0%, 97%)",
});

/**
 * Creates a background image div style - must be applied to a separate div
 * with position: fixed/absolute, z-index: -1 or lower, and pointer-events: none
 */
export const createBackgroundImageStyle = (image: string): CSSProperties => ({
  backgroundImage: `url(${image})`,
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
  pointerEvents: "none",
});

