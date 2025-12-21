/**
 * @deprecated DEPRECATED as of v1.0.2 (December 2025)
 *
 * This legacy splash screen has been replaced by SplashV2 ("Magic Heart").
 *
 * DO NOT:
 * - Import or use this component
 * - Add routes or references to this component
 * - Reactivate this component
 *
 * REMOVAL PLAN:
 * - This file will be removed in v1.1.0 or next major release
 * - All functionality is now handled by:
 *   - src/components/SplashV2/SplashV2.tsx
 *   - src/lib/boot/BootCoordinator.ts
 *
 * If you see this file still in the codebase, it can be safely deleted.
 *
 * @see SplashV2 for the current implementation
 * @see BootCoordinator for splash decision logic
 */

import React, { useEffect, useState } from "react";

/**
 * @deprecated Use SplashV2 instead
 */
export default function StartupSplashLegacyDeprecated() {
  // DEPRECATED: This component does nothing
  // It is kept only as a reference for rollback if needed
  console.warn(
    '[DEPRECATED] StartupSplashLegacyDeprecated is deprecated. Use SplashV2 instead.'
  );

  const [show] = useState(false);

  useEffect(() => {
    // DEPRECATED: No-op
    console.warn(
      '[DEPRECATED] StartupSplashLegacyDeprecated mounted but will not render. ' +
      'This component is deprecated and should not be used.'
    );
  }, []);

  // Always return null - this component is deprecated
  if (!show) return null;

  // The code below is preserved for reference only
  // It will never execute because show is always false
  return (
    <div role="dialog" aria-label="Welcome to TradeLine 24/7" aria-modal="true"
         className="fixed inset-0 z-50 grid place-items-center bg-black/20 backdrop-blur-sm animate-fade-in">
      {/* DEPRECATED: Content removed */}
      <div className="text-white text-center p-8">
        <p>This splash is deprecated. Please use SplashV2.</p>
      </div>
    </div>
  );
}

// Legacy export for backwards compatibility (deprecated)
export const StartupSplash = StartupSplashLegacyDeprecated;
