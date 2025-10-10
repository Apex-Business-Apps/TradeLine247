-- Create offline_queue table for data persistence
CREATE TABLE IF NOT EXISTS public.offline_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  operation text NOT NULL CHECK (operation IN ('insert', 'update', 'delete')),
  table_name text NOT NULL,
  data jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'syncing', 'completed', 'failed')),
  retry_count integer NOT NULL DEFAULT 0,
  last_error text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create sync_state table for tracking sync status
CREATE TABLE IF NOT EXISTS public.sync_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  table_name text NOT NULL,
  last_sync_at timestamp with time zone NOT NULL DEFAULT now(),
  sync_token text,
  metadata jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, table_name)
);

-- Enable RLS
ALTER TABLE public.offline_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_state ENABLE ROW LEVEL SECURITY;

-- RLS policies for offline_queue
CREATE POLICY "Users can manage their own offline queue"
  ON public.offline_queue
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS policies for sync_state
CREATE POLICY "Users can manage their own sync state"
  ON public.sync_state
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create update trigger function if not exists
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add update triggers
DROP TRIGGER IF EXISTS set_offline_queue_updated_at ON public.offline_queue;
CREATE TRIGGER set_offline_queue_updated_at
  BEFORE UPDATE ON public.offline_queue
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_sync_state_updated_at ON public.sync_state;
CREATE TRIGGER set_sync_state_updated_at
  BEFORE UPDATE ON public.sync_state
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_offline_queue_user_status 
  ON public.offline_queue(user_id, status);
CREATE INDEX IF NOT EXISTS idx_offline_queue_created_at 
  ON public.offline_queue(created_at);
CREATE INDEX IF NOT EXISTS idx_sync_state_user_table 
  ON public.sync_state(user_id, table_name);