import { CSSProperties } from "react";

/**
 * Global Background Image Layer Component
 * 
 * Ensures background images are always at the bottom layer (z-index: -1 or lower)
 * with pointer-events: none to prevent interference with scrolling and interactions.
 * 
 * This component MUST be used for all BACKGROUND_IMAGE1 instances across all pages.
 */
interface BackgroundImageLayerProps {
  imageUrl: string;
  className?: string;
  style?: CSSProperties;
  position?: "fixed" | "absolute";
  zIndex?: number;
}

export const BackgroundImageLayer = ({
  imageUrl,
  className = "",
  style = {},
  position = "fixed",
  zIndex = -1,
}: BackgroundImageLayerProps) => {
  return (
    <div
      className={`${position} inset-0 ${className}`}
      style={{
        backgroundImage: `url(${imageUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        pointerEvents: "none",
        zIndex,
        ...style,
      }}
      aria-hidden="true"
    />
  );
};
