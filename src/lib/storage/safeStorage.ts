// Resilient web storage shim that gracefully falls back when localStorage is unavailable
// - Works in sandboxed iframes, private mode, or strict browsers where accessing localStorage may throw
// - Provides in-memory fallback with identical API surface

const memory = new Map<string, string>();

function getLocalStorage(): Storage | null {
  try {
    if (typeof window !== 'undefined' && 'localStorage' in window) {
      // Some browsers may throw simply on property access or on use; wrap use in try/catch too
      return window.localStorage;
    }
  } catch (_e) {
    // Accessing localStorage can throw SecurityError in some environments
    return null;
  }
  return null;
}

export const safeStorage: Storage = {
  get length() {
    const ls = getLocalStorage();
    if (ls) {
      try {
        return ls.length;
      } catch {
        return memory.size;
      }
    }
    return memory.size;
  },
  clear(): void {
    const ls = getLocalStorage();
    if (ls) {
      try {
        ls.clear();
        return;
      } catch {
        // fall through to memory
      }
    }
    memory.clear();
  },
  getItem(key: string): string | null {
    const ls = getLocalStorage();
    if (ls) {
      try {
        return ls.getItem(key);
      } catch {
        // fall through to memory
      }
    }
    return memory.get(key) ?? null;
  },
  key(index: number): string | null {
    const ls = getLocalStorage();
    if (ls) {
      try {
        return ls.key(index);
      } catch {
        // fall through to memory
      }
    }
    return Array.from(memory.keys())[index] ?? null;
  },
  removeItem(key: string): void {
    const ls = getLocalStorage();
    if (ls) {
      try {
        ls.removeItem(key);
        return;
      } catch {
        // fall through to memory
      }
    }
    memory.delete(key);
  },
  setItem(key: string, value: string): void {
    const ls = getLocalStorage();
    if (ls) {
      try {
        ls.setItem(key, value);
        return;
      } catch {
        // fall through to memory
      }
    }
    memory.set(key, value);
  },
};

export default safeStorage;
