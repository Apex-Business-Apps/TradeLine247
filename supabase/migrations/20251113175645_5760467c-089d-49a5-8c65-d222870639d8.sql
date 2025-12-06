-- ============================================================================
-- RAG System Hardening: Data Persistence & Reliability
-- Adds versioning, audit logging, soft deletes, and health monitoring
-- ============================================================================

-- STEP 1: Add versioning and soft delete support to rag_sources
ALTER TABLE public.rag_sources 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS previous_version_id UUID REFERENCES public.rag_sources(id),
ADD COLUMN IF NOT EXISTS checksum TEXT;

-- STEP 2: Create rag_source_history for full audit trail
CREATE TABLE IF NOT EXISTS public.rag_source_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES public.rag_sources(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  source_type rag_source_type NOT NULL,
  external_id TEXT NOT NULL,
  title TEXT,
  uri TEXT,
  lang TEXT,
  meta JSONB,
  checksum TEXT,
  change_type TEXT CHECK (change_type IN ('created', 'updated', 'deleted', 'restored')),
  changed_by TEXT,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  change_reason TEXT,
  UNIQUE(source_id, version)
);

-- STEP 3: Create rag_ingestion_jobs for tracking bulk operations
CREATE TABLE IF NOT EXISTS public.rag_ingestion_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type TEXT NOT NULL CHECK (job_type IN ('ingest', 'update', 'delete', 'reindex')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  source_count INTEGER DEFAULT 0,
  chunk_count INTEGER DEFAULT 0,
  embedding_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  error_details JSONB,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- STEP 4: Create rag_health_metrics for monitoring
CREATE TABLE IF NOT EXISTS public.rag_health_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  metric_unit TEXT,
  severity TEXT CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  details JSONB DEFAULT '{}'::jsonb,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_rag_health_unresolved 
ON public.rag_health_metrics(metric_name, recorded_at) 
WHERE resolved_at IS NULL;

-- STEP 5: Create rag_query_analytics for search performance tracking
CREATE TABLE IF NOT EXISTS public.rag_query_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_text TEXT NOT NULL,
  query_hash TEXT NOT NULL,
  result_count INTEGER,
  top_score FLOAT,
  execution_time_ms INTEGER,
  filters_applied JSONB,
  user_id UUID,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rag_query_hash 
ON public.rag_query_analytics(query_hash, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_rag_query_performance 
ON public.rag_query_analytics(execution_time_ms DESC, created_at DESC);

-- STEP 6: Create rag_embeddings_backup for point-in-time recovery
CREATE TABLE IF NOT EXISTS public.rag_embeddings_backup (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_embedding_id UUID NOT NULL,
  chunk_id UUID NOT NULL,
  embedding VECTOR(1536) NOT NULL,
  backup_reason TEXT NOT NULL CHECK (backup_reason IN ('pre_update', 'pre_delete', 'scheduled', 'manual')),
  backed_up_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  can_restore BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_rag_embeddings_backup_chunk 
ON public.rag_embeddings_backup(chunk_id, backed_up_at DESC);

-- STEP 7: Enable RLS on new tables
ALTER TABLE public.rag_source_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rag_ingestion_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rag_health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rag_query_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rag_embeddings_backup ENABLE ROW LEVEL SECURITY;

-- STEP 8: RLS policies for new tables
CREATE POLICY "Service role can manage rag_source_history"
ON public.rag_source_history FOR ALL
USING (auth.role() = 'service_role');

CREATE POLICY "Authenticated users can read rag_source_history"
ON public.rag_source_history FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Service role can manage rag_ingestion_jobs"
ON public.rag_ingestion_jobs FOR ALL
USING (auth.role() = 'service_role');

CREATE POLICY "Authenticated users can read rag_ingestion_jobs"
ON public.rag_ingestion_jobs FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Service role can manage rag_health_metrics"
ON public.rag_health_metrics FOR ALL
USING (auth.role() = 'service_role');

CREATE POLICY "Authenticated users can read rag_health_metrics"
ON public.rag_health_metrics FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Service role can manage rag_query_analytics"
ON public.rag_query_analytics FOR ALL
USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage rag_embeddings_backup"
ON public.rag_embeddings_backup FOR ALL
USING (auth.role() = 'service_role');

-- ============================================================================
-- STEP 9: Enhanced Functions for Hardened Operations
-- ============================================================================

-- Function: rag_soft_delete_source (preserve data with audit trail)
CREATE OR REPLACE FUNCTION public.rag_soft_delete_source(
  p_source_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_source RECORD;
  v_chunks_count INTEGER;
  v_embeddings_count INTEGER;
BEGIN
  -- Get source details
  SELECT * INTO v_source
  FROM public.rag_sources
  WHERE id = p_source_id AND deleted_at IS NULL;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Source not found or already deleted'
    );
  END IF;
  
  -- Count related data
  SELECT COUNT(*) INTO v_chunks_count
  FROM public.rag_chunks
  WHERE source_id = p_source_id;
  
  SELECT COUNT(*) INTO v_embeddings_count
  FROM public.rag_embeddings e
  JOIN public.rag_chunks c ON e.chunk_id = c.id
  WHERE c.source_id = p_source_id;
  
  -- Create history record
  INSERT INTO public.rag_source_history (
    source_id,
    version,
    source_type,
    external_id,
    title,
    uri,
    lang,
    meta,
    checksum,
    change_type,
    changed_by,
    change_reason
  ) VALUES (
    v_source.id,
    v_source.version,
    v_source.source_type,
    v_source.external_id,
    v_source.title,
    v_source.uri,
    v_source.lang,
    v_source.meta,
    v_source.checksum,
    'deleted',
    current_user,
    p_reason
  );
  
  -- Soft delete source
  UPDATE public.rag_sources
  SET deleted_at = NOW(),
      updated_at = NOW()
  WHERE id = p_source_id;
  
  -- Log metric
  INSERT INTO public.rag_health_metrics (
    metric_name,
    metric_value,
    severity,
    details
  ) VALUES (
    'source_deleted',
    1,
    'info',
    jsonb_build_object(
      'source_id', p_source_id,
      'chunks_affected', v_chunks_count,
      'embeddings_affected', v_embeddings_count,
      'reason', p_reason
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'source_id', p_source_id,
    'chunks_affected', v_chunks_count,
    'embeddings_affected', v_embeddings_count
  );
END;
$$;

-- Function: rag_restore_source (recover soft-deleted source)
CREATE OR REPLACE FUNCTION public.rag_restore_source(
  p_source_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_source RECORD;
BEGIN
  -- Get deleted source
  SELECT * INTO v_source
  FROM public.rag_sources
  WHERE id = p_source_id AND deleted_at IS NOT NULL;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Source not found or not deleted'
    );
  END IF;
  
  -- Restore source
  UPDATE public.rag_sources
  SET deleted_at = NULL,
      version = version + 1,
      updated_at = NOW()
  WHERE id = p_source_id;
  
  -- Create history record
  INSERT INTO public.rag_source_history (
    source_id,
    version,
    source_type,
    external_id,
    title,
    uri,
    lang,
    meta,
    checksum,
    change_type,
    changed_by,
    change_reason
  ) VALUES (
    v_source.id,
    v_source.version + 1,
    v_source.source_type,
    v_source.external_id,
    v_source.title,
    v_source.uri,
    v_source.lang,
    v_source.meta,
    v_source.checksum,
    'restored',
    current_user,
    p_reason
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'source_id', p_source_id,
    'new_version', v_source.version + 1
  );
END;
$$;

-- Function: rag_backup_embeddings (create backup before risky operations)
CREATE OR REPLACE FUNCTION public.rag_backup_embeddings(
  p_source_id UUID,
  p_reason TEXT DEFAULT 'manual'
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_backed_up_count INTEGER := 0;
BEGIN
  INSERT INTO public.rag_embeddings_backup (
    original_embedding_id,
    chunk_id,
    embedding,
    backup_reason
  )
  SELECT 
    e.id,
    e.chunk_id,
    e.embedding,
    p_reason
  FROM public.rag_embeddings e
  JOIN public.rag_chunks c ON e.chunk_id = c.id
  WHERE c.source_id = p_source_id;
  
  GET DIAGNOSTICS v_backed_up_count = ROW_COUNT;
  
  -- Log metric
  INSERT INTO public.rag_health_metrics (
    metric_name,
    metric_value,
    severity,
    details
  ) VALUES (
    'embeddings_backed_up',
    v_backed_up_count,
    'info',
    jsonb_build_object(
      'source_id', p_source_id,
      'reason', p_reason
    )
  );
  
  RETURN v_backed_up_count;
END;
$$;

-- Function: rag_health_check (comprehensive health monitoring)
CREATE OR REPLACE FUNCTION public.rag_health_check()
RETURNS TABLE(
  check_name TEXT,
  status TEXT,
  metric_value NUMERIC,
  severity TEXT,
  details JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_sources INTEGER;
  v_active_sources INTEGER;
  v_deleted_sources INTEGER;
  v_total_chunks INTEGER;
  v_total_embeddings INTEGER;
  v_orphaned_chunks INTEGER;
  v_missing_embeddings INTEGER;
  v_avg_chunks_per_source NUMERIC;
  v_last_ingestion TIMESTAMP;
  v_stale_sources INTEGER;
BEGIN
  -- Count sources
  SELECT COUNT(*) INTO v_total_sources FROM public.rag_sources;
  SELECT COUNT(*) INTO v_active_sources FROM public.rag_sources WHERE deleted_at IS NULL;
  SELECT COUNT(*) INTO v_deleted_sources FROM public.rag_sources WHERE deleted_at IS NOT NULL;
  
  -- Count chunks and embeddings
  SELECT COUNT(*) INTO v_total_chunks FROM public.rag_chunks;
  SELECT COUNT(*) INTO v_total_embeddings FROM public.rag_embeddings;
  
  -- Check for orphaned chunks
  SELECT COUNT(*) INTO v_orphaned_chunks
  FROM public.rag_chunks c
  LEFT JOIN public.rag_sources s ON c.source_id = s.id
  WHERE s.id IS NULL OR s.deleted_at IS NOT NULL;
  
  -- Check for missing embeddings
  SELECT COUNT(*) INTO v_missing_embeddings
  FROM public.rag_chunks c
  LEFT JOIN public.rag_embeddings e ON c.id = e.chunk_id
  WHERE e.id IS NULL;
  
  -- Calculate average chunks per source
  SELECT COALESCE(AVG(chunk_cnt), 0) INTO v_avg_chunks_per_source
  FROM (
    SELECT COUNT(*) as chunk_cnt
    FROM public.rag_chunks
    GROUP BY source_id
  ) sub;
  
  -- Check last ingestion
  SELECT MAX(created_at) INTO v_last_ingestion
  FROM public.rag_sources;
  
  -- Check for stale sources (not updated in 30 days)
  SELECT COUNT(*) INTO v_stale_sources
  FROM public.rag_sources
  WHERE updated_at < NOW() - INTERVAL '30 days'
    AND deleted_at IS NULL;
  
  -- Return health metrics
  RETURN QUERY
  SELECT 'total_sources'::TEXT, 'info'::TEXT, v_total_sources::NUMERIC, 'info'::TEXT, 
         jsonb_build_object('active', v_active_sources, 'deleted', v_deleted_sources);
  
  RETURN QUERY
  SELECT 'total_chunks'::TEXT, 'info'::TEXT, v_total_chunks::NUMERIC, 'info'::TEXT, 
         jsonb_build_object('avg_per_source', v_avg_chunks_per_source);
  
  RETURN QUERY
  SELECT 'total_embeddings'::TEXT, 'info'::TEXT, v_total_embeddings::NUMERIC, 'info'::TEXT, 
         jsonb_build_object('coverage_pct', CASE WHEN v_total_chunks > 0 THEN (v_total_embeddings::FLOAT / v_total_chunks * 100) ELSE 0 END);
  
  RETURN QUERY
  SELECT 'orphaned_chunks'::TEXT, 
         CASE WHEN v_orphaned_chunks > 0 THEN 'warning' ELSE 'ok' END::TEXT,
         v_orphaned_chunks::NUMERIC,
         CASE WHEN v_orphaned_chunks > 0 THEN 'warning' ELSE 'info' END::TEXT,
         jsonb_build_object('recommendation', 'Run cleanup to remove orphaned chunks');
  
  RETURN QUERY
  SELECT 'missing_embeddings'::TEXT,
         CASE WHEN v_missing_embeddings > 100 THEN 'error' WHEN v_missing_embeddings > 0 THEN 'warning' ELSE 'ok' END::TEXT,
         v_missing_embeddings::NUMERIC,
         CASE WHEN v_missing_embeddings > 100 THEN 'error' WHEN v_missing_embeddings > 0 THEN 'warning' ELSE 'info' END::TEXT,
         jsonb_build_object('recommendation', 'Re-run embedding generation for affected chunks');
  
  RETURN QUERY
  SELECT 'data_freshness'::TEXT,
         CASE WHEN v_last_ingestion < NOW() - INTERVAL '7 days' THEN 'warning' ELSE 'ok' END::TEXT,
         EXTRACT(EPOCH FROM (NOW() - v_last_ingestion))::NUMERIC,
         CASE WHEN v_last_ingestion < NOW() - INTERVAL '7 days' THEN 'warning' ELSE 'info' END::TEXT,
         jsonb_build_object('last_ingestion', v_last_ingestion, 'days_ago', EXTRACT(DAY FROM NOW() - v_last_ingestion));
  
  RETURN QUERY
  SELECT 'stale_sources'::TEXT,
         CASE WHEN v_stale_sources > 10 THEN 'warning' ELSE 'ok' END::TEXT,
         v_stale_sources::NUMERIC,
         CASE WHEN v_stale_sources > 10 THEN 'warning' ELSE 'info' END::TEXT,
         jsonb_build_object('recommendation', 'Consider refreshing or archiving stale content');
END;
$$;

-- Function: rag_cleanup_orphaned_data (maintenance utility)
CREATE OR REPLACE FUNCTION public.rag_cleanup_orphaned_data()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted_chunks INTEGER := 0;
  v_deleted_embeddings INTEGER := 0;
BEGIN
  -- Delete orphaned embeddings (chunks that don't exist)
  DELETE FROM public.rag_embeddings
  WHERE chunk_id NOT IN (SELECT id FROM public.rag_chunks);
  
  GET DIAGNOSTICS v_deleted_embeddings = ROW_COUNT;
  
  -- Delete orphaned chunks (sources that are deleted)
  DELETE FROM public.rag_chunks
  WHERE source_id IN (
    SELECT id FROM public.rag_sources WHERE deleted_at IS NOT NULL
  );
  
  GET DIAGNOSTICS v_deleted_chunks = ROW_COUNT;
  
  -- Log cleanup
  INSERT INTO public.rag_health_metrics (
    metric_name,
    metric_value,
    severity,
    details
  ) VALUES (
    'cleanup_completed',
    v_deleted_chunks + v_deleted_embeddings,
    'info',
    jsonb_build_object(
      'chunks_deleted', v_deleted_chunks,
      'embeddings_deleted', v_deleted_embeddings
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'chunks_deleted', v_deleted_chunks,
    'embeddings_deleted', v_deleted_embeddings
  );
END;
$$;

-- ============================================================================
-- STEP 10: Triggers for automatic versioning and audit logging
-- ============================================================================

-- Trigger function: track source changes
CREATE OR REPLACE FUNCTION public.rag_track_source_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- On UPDATE, create history entry and increment version
  IF TG_OP = 'UPDATE' THEN
    -- Only log if meaningful fields changed
    IF (OLD.title IS DISTINCT FROM NEW.title) OR
       (OLD.uri IS DISTINCT FROM NEW.uri) OR
       (OLD.lang IS DISTINCT FROM NEW.lang) OR
       (OLD.meta IS DISTINCT FROM NEW.meta) THEN
      
      INSERT INTO public.rag_source_history (
        source_id,
        version,
        source_type,
        external_id,
        title,
        uri,
        lang,
        meta,
        checksum,
        change_type,
        changed_by
      ) VALUES (
        OLD.id,
        OLD.version,
        OLD.source_type,
        OLD.external_id,
        OLD.title,
        OLD.uri,
        OLD.lang,
        OLD.meta,
        OLD.checksum,
        'updated',
        current_user
      );
      
      NEW.version = OLD.version + 1;
      NEW.updated_at = NOW();
    END IF;
  END IF;
  
  -- On INSERT, create initial history entry
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.rag_source_history (
      source_id,
      version,
      source_type,
      external_id,
      title,
      uri,
      lang,
      meta,
      checksum,
      change_type,
      changed_by
    ) VALUES (
      NEW.id,
      NEW.version,
      NEW.source_type,
      NEW.external_id,
      NEW.title,
      NEW.uri,
      NEW.lang,
      NEW.meta,
      NEW.checksum,
      'created',
      current_user
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Attach trigger to rag_sources
DROP TRIGGER IF EXISTS rag_source_version_trigger ON public.rag_sources;
CREATE TRIGGER rag_source_version_trigger
BEFORE INSERT OR UPDATE ON public.rag_sources
FOR EACH ROW
EXECUTE FUNCTION public.rag_track_source_changes();

-- Trigger function: auto-backup embeddings before delete
CREATE OR REPLACE FUNCTION public.rag_auto_backup_embeddings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.rag_embeddings_backup (
      original_embedding_id,
      chunk_id,
      embedding,
      backup_reason
    ) VALUES (
      OLD.id,
      OLD.chunk_id,
      OLD.embedding,
      'pre_delete'
    );
  END IF;
  
  RETURN OLD;
END;
$$;

-- Attach trigger to rag_embeddings
DROP TRIGGER IF EXISTS rag_embedding_backup_trigger ON public.rag_embeddings;
CREATE TRIGGER rag_embedding_backup_trigger
BEFORE DELETE ON public.rag_embeddings
FOR EACH ROW
EXECUTE FUNCTION public.rag_auto_backup_embeddings();

-- ============================================================================
-- STEP 11: Indexes for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_rag_sources_deleted 
ON public.rag_sources(deleted_at, updated_at) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_rag_sources_version 
ON public.rag_sources(id, version);

CREATE INDEX IF NOT EXISTS idx_rag_source_history_lookup 
ON public.rag_source_history(source_id, version DESC, changed_at DESC);

CREATE INDEX IF NOT EXISTS idx_rag_ingestion_jobs_status 
ON public.rag_ingestion_jobs(status, created_at DESC);

-- ============================================================================
-- STEP 12: Comments for documentation
-- ============================================================================

COMMENT ON TABLE public.rag_source_history IS 
'Complete audit trail of all changes to RAG sources including soft deletes and restorations';

COMMENT ON TABLE public.rag_ingestion_jobs IS 
'Tracks bulk ingestion operations with success/failure metrics for monitoring and debugging';

COMMENT ON TABLE public.rag_health_metrics IS 
'Real-time health monitoring metrics for RAG system components';

COMMENT ON TABLE public.rag_query_analytics IS 
'Search performance analytics for query optimization and user behavior analysis';

COMMENT ON TABLE public.rag_embeddings_backup IS 
'Point-in-time backup of embeddings for disaster recovery and rollback capabilities';

COMMENT ON FUNCTION public.rag_soft_delete_source IS 
'Soft deletes a source with full audit trail - data remains in database for recovery';

COMMENT ON FUNCTION public.rag_restore_source IS 
'Restores a previously soft-deleted source with version increment';

COMMENT ON FUNCTION public.rag_health_check IS 
'Comprehensive health check returning status of all RAG system components';

COMMENT ON FUNCTION public.rag_cleanup_orphaned_data IS 
'Maintenance utility to clean up orphaned chunks and embeddings from deleted sources';