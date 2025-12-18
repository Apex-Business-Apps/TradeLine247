import backgroundImage from "@/assets/BACKGROUND_IMAGE1.svg";

/**
 * Landing Background Layers Component
 * 
 * Renders all fixed background layers for the landing page.
 * All layers have pointer-events: none and proper z-index stacking.
 * 
 * Structure:
 * - landing-wallpaper: Base photo background (z:0)
 * - landing-mask: Primary gradient mask (z:1)
 * - hero-gradient-overlay: Hero section gradient (z:2)
 * - content-gradient-overlay: Content section gradient (z:2)
 * - hero-vignette: Optional vignette effect (z:2)
 */
export function LandingBackgroundLayers() {
  return (
    <>
      {/* Base wallpaper - only element that owns the photo background */}
      <div 
        className="landing-wallpaper" 
        style={{ backgroundImage: `url(${backgroundImage})` }}
        aria-hidden="true" 
        data-bg-layer="true"
      />
      
      {/* Primary gradient mask */}
      <div 
        className="landing-mask" 
        style={{ backgroundImage: `linear-gradient(to bottom, rgba(255,107,53,0.55) 0%, rgba(104,182,233,0.55) 100%)` }}
        aria-hidden="true" 
        data-bg-layer="true"
      />
      
      {/* Hero section gradient overlay */}
      <div 
        className="hero-gradient-overlay" 
        style={{ backgroundImage: `linear-gradient(to bottom, rgba(255, 107, 53, 0.40) 0%, rgba(104, 182, 233, 0.40) 100%)` }}
        aria-hidden="true"
        data-bg-layer="true"
      />
      
      {/* Content section gradient overlay */}
      <div 
        className="content-gradient-overlay" 
        style={{ backgroundImage: `linear-gradient(to bottom, rgba(255, 107, 53, 0.72) 0%, rgba(104, 182, 233, 0.72) 100%)` }}
        aria-hidden="true"
        data-bg-layer="true"
      />
    </>
  );
}
