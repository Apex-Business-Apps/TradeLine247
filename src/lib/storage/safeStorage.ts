// Safe storage shim that gracefully falls back to in-memory storage when
// localStorage is unavailable (e.g., iframe sandboxing, Safari Private Mode, quotas)

class MemoryStorage implements Storage {
  private store = new Map<string, string>();

  get length() {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  key(index: number): string | null {
    const keys = Array.from(this.store.keys());
    return keys[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
}

function isStorageAvailable(): boolean {
  try {
    const testKey = "__safe_storage_test__";
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
    return true;
  } catch (_e) {
    return false;
  }
}

export const safeStorage: Storage = isStorageAvailable()
  ? window.localStorage
  : new MemoryStorage();

export const isMemoryStorageFallback = !isStorageAvailable();
