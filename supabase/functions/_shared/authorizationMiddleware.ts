/**
 * Server-Side Authorization Middleware
 * P0 Fix: Ensures all admin endpoints verify user roles
 *
 * Usage:
 * import { requireAdmin, requireAuth } from '../_shared/authorizationMiddleware.ts';
 *
 * const authResult = await requireAdmin(req);
 * if (!authResult.authorized) {
 *   return new Response(JSON.stringify({ error: authResult.error }), {
 *     status: authResult.status,
 *     headers: { 'Content-Type': 'application/json' }
 *   });
 * }
 * // Continue with authorized logic using authResult.user
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface AuthResult {
  authorized: boolean;
  user?: any;
  userId?: string;
  email?: string;
  role?: string;
  error?: string;
  status: number;
}

/**
 * Extract JWT token from Authorization header
 */
function extractToken(req: Request): string | null {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

/**
 * Get user role from database
 */
async function getUserRole(supabase: any, userId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('[authMiddleware] Failed to fetch user role:', error);
      return null;
    }

    return data?.role || 'user'; // Default to 'user' if no role found
  } catch (err) {
    console.error('[authMiddleware] Exception fetching user role:', err);
    return null;
  }
}

/**
 * Require authenticated user (any role)
 * Returns user info if authenticated, error response if not
 */
export async function requireAuth(req: Request): Promise<AuthResult> {
  const token = extractToken(req);

  if (!token) {
    return {
      authorized: false,
      error: 'Missing or invalid authorization token',
      status: 401
    };
  }

  // Initialize Supabase client with service role for auth verification
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[authMiddleware] Missing Supabase credentials');
    return {
      authorized: false,
      error: 'Authentication service unavailable',
      status: 503
    };
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Verify JWT and get user
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return {
      authorized: false,
      error: 'Invalid or expired token',
      status: 401
    };
  }

  // Get user role
  const role = await getUserRole(supabase, user.id);

  return {
    authorized: true,
    user,
    userId: user.id,
    email: user.email,
    role: role || 'user',
    status: 200
  };
}

/**
 * Require admin role
 * Returns user info if admin, error response if not
 */
export async function requireAdmin(req: Request): Promise<AuthResult> {
  const authResult = await requireAuth(req);

  if (!authResult.authorized) {
    return authResult;
  }

  // Check if user has admin or moderator role
  if (authResult.role !== 'admin' && authResult.role !== 'moderator') {
    return {
      authorized: false,
      error: 'Insufficient permissions - admin role required',
      status: 403
    };
  }

  return authResult;
}

/**
 * Require specific role
 */
export async function requireRole(req: Request, requiredRole: string): Promise<AuthResult> {
  const authResult = await requireAuth(req);

  if (!authResult.authorized) {
    return authResult;
  }

  if (authResult.role !== requiredRole) {
    return {
      authorized: false,
      error: `Insufficient permissions - ${requiredRole} role required`,
      status: 403
    };
  }

  return authResult;
}

/**
 * Require one of multiple roles
 */
export async function requireAnyRole(req: Request, allowedRoles: string[]): Promise<AuthResult> {
  const authResult = await requireAuth(req);

  if (!authResult.authorized) {
    return authResult;
  }

  if (!authResult.role || !allowedRoles.includes(authResult.role)) {
    return {
      authorized: false,
      error: `Insufficient permissions - one of [${allowedRoles.join(', ')}] roles required`,
      status: 403
    };
  }

  return authResult;
}

/**
 * Helper to send unauthorized response
 */
export function unauthorizedResponse(authResult: AuthResult): Response {
  return new Response(
    JSON.stringify({
      error: authResult.error,
      code: authResult.status === 401 ? 'UNAUTHORIZED' : 'FORBIDDEN'
    }),
    {
      status: authResult.status,
      headers: {
        'Content-Type': 'application/json',
        'WWW-Authenticate': authResult.status === 401 ? 'Bearer' : undefined
      } as any
    }
  );
}
