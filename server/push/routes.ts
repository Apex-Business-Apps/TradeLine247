/**
 * Push Notification API Routes
 * 
 * Express routes for push notification registration and testing.
 */

import { Router, Request, Response } from 'express';
import { supabase } from '../supabase/client';
import { sendPushToDevice } from './fcm';
import { createRateLimiter } from '../middleware/rateLimit';
import type { SupabaseClient } from '@supabase/supabase-js';

const router = Router();

// Rate limiter for push endpoints
const pushLimiter = createRateLimiter({
  windowMs: 60_000,
  maxRequests: 20,
  blockDurationMs: 15 * 60 * 1000,
});

/**
 * Middleware to extract and validate auth token
 */
async function authenticateRequest(req: Request): Promise<{ userId: string; supabaseClient: SupabaseClient } | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  
  try {
    // Verify token and get user using server-side Supabase client
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return null;
    }

    return { userId: user.id, supabaseClient: supabase };
  } catch (error) {
    console.error('[Push] Auth error:', error);
    return null;
  }
}

/**
 * POST /api/push/register
 * Register a device token for push notifications
 */
router.post('/register', pushLimiter, async (req: Request, res: Response) => {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { platform, token, appVersion, deviceInfo } = req.body;

    // Validate input
    if (!platform || !token) {
      return res.status(400).json({ 
        success: false, 
        error: 'platform and token are required' 
      });
    }

    if (platform !== 'ios' && platform !== 'android') {
      return res.status(400).json({ 
        success: false, 
        error: 'platform must be "ios" or "android"' 
      });
    }

    // Upsert device token in database
    const { data, error } = await auth.supabaseClient
      .from('device_push_tokens')
      .upsert({
        user_id: auth.userId,
        platform,
        device_token: token,
        fcm_token: token, // For now, same as device_token (FCM handles APNs conversion)
        app_version: appVersion,
        device_info: deviceInfo,
        is_active: true,
        last_seen_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,device_token',
      })
      .select()
      .single();

    if (error) {
      console.error('[Push] Database error:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to register device token' 
      });
    }

    console.info('[Push] Device registered:', { userId: auth.userId, platform, deviceId: data.id });

    return res.json({ 
      success: true, 
      deviceId: data.id 
    });
  } catch (error) {
    console.error('[Push] Registration error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
});

/**
 * POST /api/push/unregister
 * Unregister a device token
 */
router.post('/unregister', pushLimiter, async (req: Request, res: Response) => {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ 
        success: false, 
        error: 'token is required' 
      });
    }

    // Soft delete (set is_active = false)
    const { error } = await auth.supabaseClient
      .from('device_push_tokens')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', auth.userId)
      .eq('device_token', token);

    if (error) {
      console.error('[Push] Unregister error:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to unregister device token' 
      });
    }

    console.info('[Push] Device unregistered:', { userId: auth.userId, token });

    return res.json({ success: true });
  } catch (error) {
    console.error('[Push] Unregister error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
});

/**
 * POST /api/push/test
 * Send a test push notification (admin/internal only)
 */
router.post('/test', pushLimiter, async (req: Request, res: Response) => {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    // TODO: Add admin role check here
    // For now, allow any authenticated user (can be restricted later)
    // const isAdmin = await checkAdminRole(auth.userId);
    // if (!isAdmin) {
    //   return res.status(403).json({ success: false, error: 'Forbidden' });
    // }

    const { userId: targetUserId, deviceId, title, body, data } = req.body;

    if (!title || !body) {
      return res.status(400).json({ 
        success: false, 
        error: 'title and body are required' 
      });
    }

    // Get device token(s) for target user
    let query = auth.supabaseClient
      .from('device_push_tokens')
      .select('device_token, fcm_token')
      .eq('is_active', true);

    if (deviceId) {
      query = query.eq('id', deviceId);
    } else {
      const targetUser = targetUserId || auth.userId;
      query = query.eq('user_id', targetUser);
    }

    const { data: devices, error } = await query;

    if (error) {
      console.error('[Push] Database error:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch device tokens' 
      });
    }

    if (!devices || devices.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'No active device tokens found' 
      });
    }

    // Send push to all devices
    interface DeviceRow {
      device_token: string;
      fcm_token: string | null;
    }
    const tokens = (devices as DeviceRow[]).map((d) => d.fcm_token || d.device_token).filter(Boolean) as string[];
    
    if (tokens.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'No valid tokens found' 
      });
    }

    interface PushResult {
      token: string;
      success: boolean;
      messageId?: string;
      error?: string;
    }
    
    const results: PushResult[] = [];
    for (const token of tokens) {
      try {
        const messageId = await sendPushToDevice(token, { title, body, data });
        results.push({ token, success: true, messageId });
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.push({ 
          token, 
          success: false, 
          error: errorMessage,
        });
        
        // If token is invalid, mark as inactive
        if (errorMessage === 'INVALID_TOKEN') {
          await auth.supabaseClient
            .from('device_push_tokens')
            .update({ is_active: false })
            .eq('device_token', token);
        }
      }
    }

    const successCount = results.filter((r) => r.success).length;

    return res.json({
      success: successCount > 0,
      sent: successCount,
      total: tokens.length,
      results,
    });
  } catch (error) {
    console.error('[Push] Test error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
});

export default router;

