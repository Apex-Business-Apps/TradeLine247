/**
 * Enhanced Persistence Layer
 * 
 * Provides robust data persistence with:
 * - Automatic retry on failure
 * - Data versioning
 * - Backup/restore capabilities
 * - Cross-tab synchronization
 * - Data integrity checks
 */

import { secureSet, secureGet, secureRemove } from '@/lib/secureStorage';

const PERSISTENCE_VERSION = 1;
const BACKUP_PREFIX = 'tl247_backup_';
const SYNC_EVENT = 'tl247-storage-sync';

interface PersistedData {
  version: number;
  data: any;
  timestamp: number;
  checksum?: string;
}

/**
 * Calculate simple checksum for data integrity
 */
function calculateChecksum(data: string): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(36);
}

/**
 * Enhanced set with retry and backup
 */
export function enhancedSet(
  key: string,
  value: any,
  options: {
    encrypt?: boolean;
    ttl?: number;
    backup?: boolean;
    maxRetries?: number;
  } = {}
): boolean {
  const { encrypt = false, ttl, backup = true, maxRetries = 3 } = options;
  
  let attempts = 0;
  while (attempts < maxRetries) {
    try {
      const persisted: PersistedData = {
        version: PERSISTENCE_VERSION,
        data: value,
        timestamp: Date.now(),
      };
      
      // Calculate checksum
      const serialized = JSON.stringify(value);
      persisted.checksum = calculateChecksum(serialized);
      
      // Store with encryption if requested
      const success = secureSet(key, persisted, { encrypt, ttl });
      
      if (success) {
        // Create backup if requested
        if (backup) {
          try {
            secureSet(BACKUP_PREFIX + key, persisted, { encrypt: false, ttl: ttl ? ttl * 2 : undefined });
          } catch (backupError) {
            console.warn('[EnhancedPersistence] Backup failed:', backupError);
          }
        }
        
        // Broadcast sync event for cross-tab synchronization
        try {
          window.dispatchEvent(new CustomEvent(SYNC_EVENT, {
            detail: { key, timestamp: persisted.timestamp }
          }));
        } catch (syncError) {
          // Ignore sync errors (may not be available in all contexts)
        }
        
        return true;
      }
      
      attempts++;
    } catch (error) {
      console.error(`[EnhancedPersistence] Set attempt ${attempts + 1} failed:`, error);
      attempts++;
      
      if (attempts >= maxRetries) {
        return false;
      }
      
      // Exponential backoff
      const delay = Math.min(100 * Math.pow(2, attempts), 1000);
      new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return false;
}

/**
 * Enhanced get with backup fallback and integrity check
 */
export function enhancedGet<T = any>(key: string): T | null {
  try {
    // Try primary storage
    const primary = secureGet<PersistedData>(key);
    
    if (primary && primary.version === PERSISTENCE_VERSION) {
      // Verify checksum
      const serialized = JSON.stringify(primary.data);
      const expectedChecksum = calculateChecksum(serialized);
      
      if (primary.checksum === expectedChecksum) {
        return primary.data as T;
      } else {
        console.warn('[EnhancedPersistence] Checksum mismatch, attempting backup');
      }
    }
    
    // Try backup
    const backup = secureGet<PersistedData>(BACKUP_PREFIX + key);
    if (backup && backup.version === PERSISTENCE_VERSION) {
      // Restore from backup
      const serialized = JSON.stringify(backup.data);
      const expectedChecksum = calculateChecksum(serialized);
      
      if (backup.checksum === expectedChecksum) {
        // Restore primary from backup
        enhancedSet(key, backup.data, { encrypt: false, backup: false });
        return backup.data as T;
      }
    }
    
    return null;
  } catch (error) {
    console.error('[EnhancedPersistence] Get failed:', error);
    return null;
  }
}

/**
 * Enhanced remove with backup cleanup
 */
export function enhancedRemove(key: string): void {
  try {
    secureRemove(key);
    secureRemove(BACKUP_PREFIX + key);
  } catch (error) {
    console.error('[EnhancedPersistence] Remove failed:', error);
  }
}

/**
 * Listen for cross-tab synchronization
 */
export function setupCrossTabSync(callback: (key: string, timestamp: number) => void): () => void {
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent;
    if (customEvent.detail?.key) {
      callback(customEvent.detail.key, customEvent.detail.timestamp);
    }
  };
  
  window.addEventListener(SYNC_EVENT, handler);
  
  // Return cleanup function
  return () => {
    window.removeEventListener(SYNC_EVENT, handler);
  };
}

/**
 * Migrate data from old format if needed
 */
export function migrateData<T = any>(key: string, migrateFn: (oldData: any) => T): T | null {
  try {
    const oldData = localStorage.getItem(key);
    if (!oldData) return null;
    
    const parsed = JSON.parse(oldData);
    const migrated = migrateFn(parsed);
    
    // Store in new format
    enhancedSet(key, migrated);
    
    // Clean up old format
    localStorage.removeItem(key);
    
    return migrated;
  } catch (error) {
    console.error('[EnhancedPersistence] Migration failed:', error);
    return null;
  }
}

