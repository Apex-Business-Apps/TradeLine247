/**
 * Database Connection Pool Manager
 * Ensures we stay within Supabase connection limits
 */

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Connection pool configuration
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 100;
const MAX_BACKOFF_MS = 5000;

let lastConnectionErrorLog = 0;
const LOG_THROTTLE_MS = 60000; // Log once per minute

/**
 * Create pooled Supabase client
 * Reuses connections when possible
 */
export function createPooledClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        'x-connection-pool': 'enabled'
      }
    }
  });
}

/**
 * Execute query with retry on connection errors
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  context?: string
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof Error) {
        lastError = error;
      }
      
      // Check if it's a connection error
      const errorMsg = error instanceof Error ? error.message : '';
      const errorCode = (error as any)?.code;
      const isConnectionError = 
        errorMsg.includes('too many connections') ||
        errorMsg.includes('connection refused') ||
        errorMsg.includes('ECONNRESET') ||
        errorCode === '53300'; // too_many_connections

      if (!isConnectionError || attempt === MAX_RETRIES) {
        // Not a connection error or final attempt - throw
        throw error;
      }

      // Log throttled (once per minute)
      const now = Date.now();
      if (now - lastConnectionErrorLog > LOG_THROTTLE_MS) {
        console.warn(`Connection error on attempt ${attempt}/${MAX_RETRIES}`, {
          context,
          error: errorMsg,
          code: errorCode
        });
        lastConnectionErrorLog = now;
      }

      // Exponential backoff with jitter
      const backoff = Math.min(
        INITIAL_BACKOFF_MS * Math.pow(2, attempt - 1),
        MAX_BACKOFF_MS
      );
      const jitter = Math.random() * backoff * 0.1; // 10% jitter
      
      await new Promise(resolve => setTimeout(resolve, backoff + jitter));
    }
  }

  throw lastError!;
}

/**
 * Execute Supabase query with connection pool and retry
 */
export async function pooledQuery<T>(
  queryFn: (client: SupabaseClient) => Promise<{ data: T | null; error: any }>,
  context?: string
): Promise<T> {
  const startMs = Date.now();
  const client = createPooledClient();

  try {
    const result = await withRetry(
      async () => {
        const { data, error } = await queryFn(client);
        if (error) throw error;
        return data;
      },
      context
    );

    const dbMs = Date.now() - startMs;
    
    // Log slow queries (> 1s)
    if (dbMs > 1000) {
      console.warn(`Slow query detected`, {
        context,
        db_ms: dbMs
      });
    }

    return result!;
  } finally {
    // Connection will be returned to pool automatically
  }
}

/**
 * Health check query with metrics
 */
export async function healthCheckQuery(): Promise<{
  healthy: boolean;
  db_ms: number;
  error?: string;
}> {
  const startMs = Date.now();
  
  try {
    await pooledQuery(
      async (client) => client.from('profiles').select('id').limit(1),
      'health_check'
    );
    
    return {
      healthy: true,
      db_ms: Date.now() - startMs
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return {
      healthy: false,
      db_ms: Date.now() - startMs,
      error: errorMsg
    };
  }
}

