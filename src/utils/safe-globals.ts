// Browser/Deno guard: provide a minimal process.env only.
// IMPORTANT: No 'buffer' import here (Vite 5 does not auto-polyfill Node core).
declare global { var process: any | undefined; }
;(globalThis as any).process = (globalThis as any).process ?? { env: {} };
export {};
