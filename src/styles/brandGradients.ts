import { CSSProperties } from "react";

/**
 * Creates a reusable background style that blends TradeLine's logo colors:
 * - Logo orange #FF6B35 (top) → Logo blue #68B6E9 (bottom)
 * - 45% opacity for internal pages + 23% white tint
 * - Layered over the background illustration
 */
export const createBrandGradientStyle = (image: string): CSSProperties => ({
  backgroundImage: `
    linear-gradient(to bottom, rgba(255, 255, 255, 0.28), rgba(255, 255, 255, 0.28)),
    linear-gradient(
      to bottom,
      rgba(255, 107, 53, 0.52) 0%,
      rgba(104, 182, 233, 0.52) 100%
    ),
    url(${image})
  `,
  backgroundSize: "auto, auto, cover",
  backgroundPosition: "center, center, center",
  backgroundRepeat: "no-repeat, no-repeat, no-repeat",
  backgroundAttachment: "scroll, scroll, fixed",
  backgroundColor: "hsl(0, 0%, 97%)",
});

