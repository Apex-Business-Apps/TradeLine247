// Temporary NOOP to ensure guards never blank public routes.
// Keep function signature so existing imports don't break.
export function allowPublicRoutes(pathname: string): boolean {
  // Allow all marketing routes to render unconditionally.
  // Tighten later with an explicit allowlist if you want.
  return true;
}

// LOVABLE-GUARD: runtime self-heal; hero code untouched.
// UPDATED: Relaxed locking to allow Lovable editor to function properly
export function enforceHeroRoiDuo() {
  const a = document.getElementById("start-trial-hero");
  const b = document.getElementById("roi-calculator");
  if (!a || !b) return;

  // ensure shared wrapper with canonical classes/attrs
  let wrapper = document.getElementById("hero-roi-duo");
  if (!wrapper) {
    wrapper = document.createElement("section");
    wrapper.id = "hero-roi-duo";
    wrapper.className = "hero-roi__grid";
    wrapper.setAttribute("data-lock", "true");
    // FIXED: Changed from "permanent" to "structure-only" to allow styling
    wrapper.setAttribute("data-lovable-lock", "structure-only");
    const first = (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) ? a : b;
    first.parentElement?.insertBefore(wrapper, first);
  }
  if (a.parentElement !== wrapper) wrapper.appendChild(a);
  if (b.parentElement !== wrapper) wrapper.appendChild(b);

  // outer container for max-width + padding if missing
  if (!wrapper.parentElement?.classList.contains("hero-roi__container")) {
    const container = document.createElement("div");
    container.className = "hero-roi__container";
    // FIXED: Changed from "permanent" to "structure-only"
    container.setAttribute("data-lovable-lock", "structure-only");
    wrapper.parentElement?.insertBefore(container, wrapper);
    container.appendChild(wrapper);
  }

  // FIXED: Lock structure but allow styling modifications
  a.setAttribute("data-lovable-lock", "structure-only");
  b.setAttribute("data-lovable-lock", "structure-only");

  // Enforce portrait mode centering
  const isPortrait = window.innerHeight > window.innerWidth;
  if (isPortrait) {
    a.style.transform = "none";
    b.style.transform = "none";
    a.style.margin = "0 auto";
    b.style.margin = "0 auto";
  }
}

// FIXED: Enhanced locking that allows Lovable editor to function
// Changed from freezing all modifications to selective protection
export function lockHeroElementsPermanently() {
  const elements = [
    document.getElementById("start-trial-hero"),
    document.getElementById("roi-calculator"),
    document.getElementById("hero-roi-duo"),
    document.querySelector(".hero-roi__container")
  ].filter(Boolean) as HTMLElement[];

  elements.forEach((el) => {
    // FIXED: Use "structure-only" lock instead of "permanent"
    // This allows Lovable to modify styling, content, and attributes
    // while preventing structural changes (deletion, moving to different parents)
    el.setAttribute("data-lovable-lock", "structure-only");
    el.setAttribute("data-layout-lock", "soft");

    // REMOVED: The Object.defineProperty freeze that completely blocked modifications
    // Lovable editor needs to be able to modify styles for visual editing
    // Instead, we rely on Lovable's built-in respect for lock attributes
  });
}

/**
 * Check if Lovable editor is active and should have elevated permissions
 * Detects Lovable preview environments and dev mode
 */
export function isLovableEditorActive(): boolean {
  if (typeof window === 'undefined') return false;

  // Check for Lovable preview domains
  const hostname = window.location.hostname;
  const isLovableDomain = hostname.includes('lovable.app') ||
                          hostname.includes('lovable.dev') ||
                          hostname.includes('lovableproject.com');

  // Check for dev mode
  const isDevMode = import.meta.env.DEV;

  // Check for Lovable component tagger presence
  const hasTagger = document.querySelector('[data-lovable-component]') !== null;

  return isLovableDomain || (isDevMode && hasTagger);
}

/**
 * Initialize layout guards with Lovable-aware configuration
 * Call this on app mount to set up protection with editor compatibility
 */
export function initializeLayoutGuards() {
  // Run initial enforcement
  enforceHeroRoiDuo();
  lockHeroElementsPermanently();

  // Set up mutation observer to re-enforce on changes (but not too aggressively)
  if (typeof window !== 'undefined' && typeof MutationObserver !== 'undefined') {
    const observer = new MutationObserver((mutations) => {
      // Only re-enforce if actual structure changed (not just styling)
      const hasStructureChange = mutations.some(mutation =>
        mutation.type === 'childList' ||
        (mutation.type === 'attributes' && mutation.attributeName === 'id')
      );

      if (hasStructureChange) {
        enforceHeroRoiDuo();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['id', 'class']
    });
  }
}
