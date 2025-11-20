import { detectSafeModeFromSearch, enableSafeModeSideEffects } from "./lib/safeMode";

if (typeof window !== "undefined") {
  const search = window.location.search || "";
  if (detectSafeModeFromSearch(search)) {
    enableSafeModeSideEffects();
  }
}

