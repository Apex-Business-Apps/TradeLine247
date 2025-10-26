// Minimal, browser/Deno-safe guards. No external deps.
declare global { var process: any | undefined; var Buffer: any | undefined; }
;(globalThis as any).process = (globalThis as any).process ?? { env: {} };

(function exposeBuffer() {
  if (!(globalThis as any).Buffer) {
    try {
      // dynamic import; harmless if 'buffer' isn’t present / tree-shaken
      // @ts-ignore
      import('buffer').then((m: any) => {
        if (m?.Buffer && !(globalThis as any).Buffer) (globalThis as any).Buffer = m.Buffer;
      }).catch(() => {});
    } catch {}
  }
})();
export {};
