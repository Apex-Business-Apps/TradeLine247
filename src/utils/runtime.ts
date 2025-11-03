// Runtime guards usable anywhere (browser, Node, Deno)
export const isDeno = typeof globalThis.Deno !== "undefined";
export const isNode = typeof process !== "undefined" && !!(process as any).versions?.node;
export const isBrowser = typeof window !== "undefined" && !isDeno;
