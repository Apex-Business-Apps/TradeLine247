-- Migration: Add device_push_tokens table for push notification registration
-- Date: 2025-01-06
-- Purpose: Store device tokens for iOS and Android push notifications

-- Create device_push_tokens table
CREATE TABLE IF NOT EXISTS public.device_push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
  device_token TEXT NOT NULL,
  fcm_token TEXT, -- FCM registration token (same as device_token for Android, different for iOS)
  app_version TEXT,
  device_info JSONB, -- Optional: device model, OS version, etc.
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, device_token)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_device_push_tokens_user_id 
  ON public.device_push_tokens(user_id);

CREATE INDEX IF NOT EXISTS idx_device_push_tokens_active 
  ON public.device_push_tokens(is_active) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_device_push_tokens_platform 
  ON public.device_push_tokens(platform);

-- Enable Row Level Security
ALTER TABLE public.device_push_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can manage their own device tokens
CREATE POLICY "Users can manage their own device tokens"
  ON public.device_push_tokens
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Add comment for documentation
COMMENT ON TABLE public.device_push_tokens IS 'Stores device push notification tokens for iOS and Android devices';
COMMENT ON COLUMN public.device_push_tokens.device_token IS 'Platform-specific device token (APNs token for iOS, FCM token for Android)';
COMMENT ON COLUMN public.device_push_tokens.fcm_token IS 'FCM registration token (used for sending notifications via Firebase)';

