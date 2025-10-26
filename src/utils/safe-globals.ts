// Safe shims so libraries that poke at process don’t crash in Deno/browser.
declare global {
  // minimal type so TS is happy when 'process' doesn’t exist
  var process: any | undefined;
}
export const safeProcess = (typeof process !== "undefined" ? process : { env: {} });
