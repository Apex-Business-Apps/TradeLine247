// src/utils/safe-globals.ts
// Minimal, browser/Deno-safe guards. No external deps.
declare global {
  // eslint-disable-next-line no-var
  var process: any | undefined;
  // eslint-disable-next-line no-var
  var Buffer: any | undefined;
}

// Provide a minimal process.env so libs can read keys safely.
;(globalThis as any).process = (globalThis as any).process ?? { env: {} };

// Try to expose Buffer if available at runtime; otherwise no-op.
// We avoid top-level await to keep TS configs happy on all targets.
(function exposeBuffer() {
  if (!(globalThis as any).Buffer) {
    try {
      // Vite may inline a browser Buffer polyfill; if not present, this falls through.
      // Using dynamic import keeps this tree-shakeable and harmless in Deno.
      // @ts-ignore - type not required for dynamic import
      import('buffer').then((mod: any) => {
        if (mod?.Buffer && !(globalThis as any).Buffer) {
          (globalThis as any).Buffer = mod.Buffer;
        }
      }).catch(() => { /* ignore */ });
    } catch {
      // ignore
    }
  }
})();
export {};
