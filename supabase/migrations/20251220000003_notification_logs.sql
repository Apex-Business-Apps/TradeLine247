-- Notification Logs Table
-- Tracks owner notification attempts for audit and cooldown enforcement

CREATE TABLE IF NOT EXISTS public.notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  call_id TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'skipped')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast cooldown checks
CREATE INDEX IF NOT EXISTS idx_notification_logs_event_call ON public.notification_logs(event_type, call_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at ON public.notification_logs(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON public.notification_logs(status);

-- Enable RLS
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'notification_logs' AND policyname = 'Service role full access notification_logs'
  ) THEN
    CREATE POLICY "Service role full access notification_logs"
      ON public.notification_logs
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Comment
COMMENT ON TABLE public.notification_logs IS 'Tracks owner notification attempts for audit and spam prevention';
