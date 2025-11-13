-- Phase 6: Priority Queue System
-- Batch processing with priority levels and job tracking

-- Priority queue table
CREATE TABLE IF NOT EXISTS public.priority_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'retrying')),
  tenant_id UUID,
  scheduled_for TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  error_message TEXT,
  error_details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Batch jobs tracking table
CREATE TABLE IF NOT EXISTS public.batch_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id TEXT NOT NULL,
  total_items INTEGER NOT NULL DEFAULT 0,
  processed_items INTEGER NOT NULL DEFAULT 0,
  successful_items INTEGER NOT NULL DEFAULT 0,
  failed_items INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'paused')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_priority_queue_status_priority 
  ON public.priority_queue(status, priority DESC, created_at) 
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_priority_queue_scheduled 
  ON public.priority_queue(scheduled_for) 
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_priority_queue_tenant 
  ON public.priority_queue(tenant_id);

CREATE INDEX IF NOT EXISTS idx_priority_queue_job_type 
  ON public.priority_queue(job_type);

CREATE INDEX IF NOT EXISTS idx_batch_jobs_batch_id 
  ON public.batch_jobs(batch_id);

CREATE INDEX IF NOT EXISTS idx_batch_jobs_status 
  ON public.batch_jobs(status);

-- Enable RLS
ALTER TABLE public.priority_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for priority_queue
CREATE POLICY "Users can view their tenant's queue items"
  ON public.priority_queue
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT org_id FROM public.organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role full access to queue"
  ON public.priority_queue
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- RLS Policies for batch_jobs
CREATE POLICY "Users can view batch jobs"
  ON public.batch_jobs
  FOR SELECT
  USING (true);

CREATE POLICY "Service role full access to batch jobs"
  ON public.batch_jobs
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Function to enqueue job with priority
CREATE OR REPLACE FUNCTION public.enqueue_job(
  p_job_type TEXT,
  p_payload JSONB,
  p_priority INTEGER DEFAULT 5,
  p_tenant_id UUID DEFAULT NULL,
  p_scheduled_for TIMESTAMPTZ DEFAULT NOW()
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_job_id UUID;
BEGIN
  INSERT INTO public.priority_queue (
    job_type,
    payload,
    priority,
    tenant_id,
    scheduled_for,
    status
  ) VALUES (
    p_job_type,
    p_payload,
    GREATEST(1, LEAST(10, p_priority)),
    p_tenant_id,
    p_scheduled_for,
    'pending'
  )
  RETURNING id INTO v_job_id;
  
  RETURN v_job_id;
END;
$$;

-- Function to fetch next batch of jobs
CREATE OR REPLACE FUNCTION public.fetch_next_batch(
  p_batch_size INTEGER DEFAULT 10,
  p_job_types TEXT[] DEFAULT NULL
)
RETURNS TABLE(
  job_id UUID,
  job_type TEXT,
  priority INTEGER,
  payload JSONB,
  attempts INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  UPDATE public.priority_queue
  SET 
    status = 'processing',
    started_at = NOW(),
    updated_at = NOW()
  WHERE id IN (
    SELECT pq.id
    FROM public.priority_queue pq
    WHERE pq.status = 'pending'
      AND pq.scheduled_for <= NOW()
      AND (p_job_types IS NULL OR pq.job_type = ANY(p_job_types))
      AND pq.attempts < pq.max_attempts
    ORDER BY pq.priority DESC, pq.created_at ASC
    LIMIT p_batch_size
    FOR UPDATE SKIP LOCKED
  )
  RETURNING 
    id,
    priority_queue.job_type,
    priority_queue.priority,
    priority_queue.payload,
    priority_queue.attempts;
END;
$$;

-- Function to mark job as completed
CREATE OR REPLACE FUNCTION public.complete_job(
  p_job_id UUID,
  p_success BOOLEAN,
  p_error_message TEXT DEFAULT NULL,
  p_error_details JSONB DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_success THEN
    UPDATE public.priority_queue
    SET 
      status = 'completed',
      completed_at = NOW(),
      updated_at = NOW()
    WHERE id = p_job_id;
  ELSE
    UPDATE public.priority_queue
    SET 
      status = CASE 
        WHEN attempts + 1 >= max_attempts THEN 'failed'
        ELSE 'retrying'
      END,
      attempts = attempts + 1,
      error_message = p_error_message,
      error_details = p_error_details,
      updated_at = NOW(),
      scheduled_for = CASE
        WHEN attempts + 1 < max_attempts 
        THEN NOW() + (POWER(2, attempts + 1) || ' minutes')::INTERVAL
        ELSE scheduled_for
      END
    WHERE id = p_job_id;
  END IF;
END;
$$;

-- Function to get queue statistics
CREATE OR REPLACE FUNCTION public.get_queue_stats()
RETURNS TABLE(
  total_pending BIGINT,
  total_processing BIGINT,
  total_completed_today BIGINT,
  total_failed_today BIGINT,
  avg_processing_time_seconds NUMERIC,
  by_priority JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE status = 'pending')::BIGINT,
    COUNT(*) FILTER (WHERE status = 'processing')::BIGINT,
    COUNT(*) FILTER (WHERE status = 'completed' AND completed_at > NOW() - INTERVAL '1 day')::BIGINT,
    COUNT(*) FILTER (WHERE status = 'failed' AND updated_at > NOW() - INTERVAL '1 day')::BIGINT,
    ROUND(AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) FILTER (WHERE status = 'completed' AND completed_at > NOW() - INTERVAL '1 day'), 2),
    jsonb_object_agg(
      priority::TEXT,
      count
    ) FILTER (WHERE status = 'pending')
  FROM public.priority_queue
  LEFT JOIN LATERAL (
    SELECT COUNT(*) as count
    FROM public.priority_queue pq2
    WHERE pq2.priority = priority_queue.priority AND pq2.status = 'pending'
  ) counts ON true
  GROUP BY priority;
END;
$$;

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_priority_queue_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_priority_queue_updated_at
  BEFORE UPDATE ON public.priority_queue
  FOR EACH ROW
  EXECUTE FUNCTION public.update_priority_queue_updated_at();

CREATE OR REPLACE FUNCTION public.update_batch_jobs_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_batch_jobs_updated_at
  BEFORE UPDATE ON public.batch_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_batch_jobs_updated_at();