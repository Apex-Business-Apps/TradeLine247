// Minimal shim for libs that read process.env in the browser.
// No global type augmentation = no conflicts with @types/node.
const g = globalThis as any;
g.process ??= { env: {} as Record<string, string | undefined> };
export {};
