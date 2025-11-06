// Idempotency Key Manager
// Prevents duplicate operations from retries or race conditions

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
const encoder = new TextEncoder();
async function sha256Hex(input: string): Promise<string> {
  const bytes = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", bytes);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

export interface IdempotencyResult {
  is_duplicate: boolean;
  is_retry?: boolean;
  status?: string;
  result?: any;
  message?: string;
}

/**
 * Generate idempotency key from request
 */
export async function generateIdempotencyKey(
  operationType: string,
  ...args: any[]
): Promise<string> {
  const data = JSON.stringify({ operationType, args });
  const hash = await sha256Hex(data);
  return `${operationType}_${hash}`;
}

/**
 * Hash request parameters for comparison
 */
export async function hashRequest(...args: any[]): Promise<string> {
  const data = JSON.stringify(args);
  return await sha256Hex(data);
}

/**
 * Check if operation has already been performed
 */
export async function checkIdempotency(
  supabase: SupabaseClient,
  idempotencyKey: string,
  operationType: string,
  requestHash: string
): Promise<IdempotencyResult> {
  try {
    const { data, error } = await supabase.rpc('check_idempotency_key', {
      p_key: idempotencyKey,
      p_operation_type: operationType,
      p_request_hash: requestHash
    });

    if (error) {
      console.error('Idempotency check error:', error);
      // Fail open - allow operation
      return { is_duplicate: false };
    }

    return data as IdempotencyResult;
  } catch (err) {
    console.error('Idempotency exception:', err);
    return { is_duplicate: false };
  }
}

/**
 * Mark operation as completed
 */
export async function completeIdempotency(
  supabase: SupabaseClient,
  idempotencyKey: string,
  result: any
): Promise<void> {
  try {
    await supabase.rpc('complete_idempotency_key', {
      p_key: idempotencyKey,
      p_result: result,
      p_status: 'completed'
    });
  } catch (err) {
    console.error('Error completing idempotency:', err);
  }
}

/**
 * Mark operation as failed
 */
export async function failIdempotency(
  supabase: SupabaseClient,
  idempotencyKey: string,
  errorMessage: string
): Promise<void> {
  try {
    await supabase.rpc('fail_idempotency_key', {
      p_key: idempotencyKey,
      p_error_message: errorMessage
    });
  } catch (err) {
    console.error('Error failing idempotency:', err);
  }
}

/**
 * Wrapper for idempotent operations
 */
export async function withIdempotency<T>(
  supabase: SupabaseClient,
  operationType: string,
  args: any[],
  operation: () => Promise<T>
): Promise<T> {
  const requestHash = await hashRequest(...args);
  const idempotencyKey = await generateIdempotencyKey(operationType, ...args);

  // Check if already executed
  const check = await checkIdempotency(
    supabase,
    idempotencyKey,
    operationType,
    requestHash
  );

  if (check.is_duplicate) {
    if (check.status === 'completed') {
      console.log('Returning cached result for', idempotencyKey);
      return check.result as T;
    } else if (check.status === 'processing') {
      throw new Error('Operation already in progress');
    }
  }

  // Execute operation
  try {
    const result = await operation();
    await completeIdempotency(supabase, idempotencyKey, result);
    return result;
  } catch (error: any) {
    await failIdempotency(supabase, idempotencyKey, error.message);
    throw error;
  }
}
