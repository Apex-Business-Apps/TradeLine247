-- ============================================================================
-- Phase 8: Advanced Caching System
-- ============================================================================
-- Redis-like caching layer for frequently accessed data
-- Includes cache warming, TTL management, and invalidation strategies

-- ============================================================================
-- Cache Storage Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.api_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT NOT NULL UNIQUE,
  cache_value JSONB NOT NULL,
  cache_type TEXT NOT NULL, -- 'api', 'query', 'computed', 'static'
  ttl_seconds INTEGER NOT NULL DEFAULT 300,
  priority INTEGER DEFAULT 0, -- Higher priority = more important to cache
  hit_count INTEGER DEFAULT 0,
  miss_count INTEGER DEFAULT 0,
  last_hit_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  tags TEXT[] DEFAULT '{}', -- For bulk invalidation
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for performance
CREATE INDEX idx_api_cache_key ON public.api_cache(cache_key);
CREATE INDEX idx_api_cache_expires ON public.api_cache(expires_at);
CREATE INDEX idx_api_cache_type ON public.api_cache(cache_type);
CREATE INDEX idx_api_cache_priority ON public.api_cache(priority DESC);
CREATE INDEX idx_api_cache_tags ON public.api_cache USING GIN(tags);
CREATE INDEX idx_api_cache_hit_count ON public.api_cache(hit_count DESC);

-- ============================================================================
-- Cache Warming Configuration
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.cache_warming_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key TEXT NOT NULL UNIQUE,
  endpoint TEXT NOT NULL,
  params JSONB DEFAULT '{}'::jsonb,
  warmup_interval_minutes INTEGER NOT NULL DEFAULT 5,
  enabled BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  last_warmed_at TIMESTAMPTZ,
  next_warmup_at TIMESTAMPTZ,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cache_warming_enabled ON public.cache_warming_config(enabled, next_warmup_at);
CREATE INDEX idx_cache_warming_priority ON public.cache_warming_config(priority DESC);

-- ============================================================================
-- Cache Statistics
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.cache_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stat_date DATE NOT NULL,
  cache_type TEXT NOT NULL,
  total_hits BIGINT DEFAULT 0,
  total_misses BIGINT DEFAULT 0,
  avg_ttl_seconds INTEGER,
  total_size_bytes BIGINT,
  evictions INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(stat_date, cache_type)
);

CREATE INDEX idx_cache_stats_date ON public.cache_stats(stat_date DESC);

-- ============================================================================
-- RLS Policies
-- ============================================================================
ALTER TABLE public.api_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cache_warming_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cache_stats ENABLE ROW LEVEL SECURITY;

-- Cache is readable by all authenticated users
CREATE POLICY "Cache readable by authenticated users"
  ON public.api_cache FOR SELECT
  TO authenticated
  USING (true);

-- Cache writable only by service role (edge functions)
CREATE POLICY "Cache writable by service"
  ON public.api_cache FOR ALL
  TO service_role
  USING (true);

-- Config readable by authenticated
CREATE POLICY "Cache config readable"
  ON public.cache_warming_config FOR SELECT
  TO authenticated
  USING (true);

-- Config writable by service
CREATE POLICY "Cache config writable by service"
  ON public.cache_warming_config FOR ALL
  TO service_role
  USING (true);

-- Stats readable by all
CREATE POLICY "Cache stats readable"
  ON public.cache_stats FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- Cache Functions
-- ============================================================================

-- Get cached value with automatic hit tracking
CREATE OR REPLACE FUNCTION public.get_cached_value(
  p_cache_key TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_value JSONB;
  v_expired BOOLEAN;
BEGIN
  -- Try to get non-expired cache entry
  SELECT 
    cache_value,
    expires_at < NOW()
  INTO v_value, v_expired
  FROM public.api_cache
  WHERE cache_key = p_cache_key;

  -- If found and not expired
  IF FOUND AND NOT v_expired THEN
    -- Update hit count
    UPDATE public.api_cache
    SET 
      hit_count = hit_count + 1,
      last_hit_at = NOW()
    WHERE cache_key = p_cache_key;
    
    RETURN v_value;
  END IF;

  -- If expired, delete it
  IF FOUND AND v_expired THEN
    DELETE FROM public.api_cache WHERE cache_key = p_cache_key;
  END IF;

  -- Record miss
  UPDATE public.api_cache
  SET miss_count = miss_count + 1
  WHERE cache_key = p_cache_key;

  RETURN NULL;
END;
$$;

-- Set cached value with TTL
CREATE OR REPLACE FUNCTION public.set_cached_value(
  p_cache_key TEXT,
  p_value JSONB,
  p_ttl_seconds INTEGER DEFAULT 300,
  p_cache_type TEXT DEFAULT 'api',
  p_priority INTEGER DEFAULT 0,
  p_tags TEXT[] DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cache_id UUID;
BEGIN
  INSERT INTO public.api_cache (
    cache_key,
    cache_value,
    cache_type,
    ttl_seconds,
    priority,
    tags,
    expires_at,
    created_by
  )
  VALUES (
    p_cache_key,
    p_value,
    p_cache_type,
    p_ttl_seconds,
    p_priority,
    p_tags,
    NOW() + (p_ttl_seconds || ' seconds')::INTERVAL,
    auth.uid()
  )
  ON CONFLICT (cache_key) 
  DO UPDATE SET
    cache_value = EXCLUDED.cache_value,
    ttl_seconds = EXCLUDED.ttl_seconds,
    priority = EXCLUDED.priority,
    tags = EXCLUDED.tags,
    expires_at = EXCLUDED.expires_at,
    created_at = NOW()
  RETURNING id INTO v_cache_id;

  RETURN v_cache_id;
END;
$$;

-- Invalidate cache by key or pattern
CREATE OR REPLACE FUNCTION public.invalidate_cache(
  p_pattern TEXT DEFAULT NULL,
  p_tags TEXT[] DEFAULT NULL,
  p_cache_type TEXT DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM public.api_cache
  WHERE 
    (p_pattern IS NULL OR cache_key LIKE p_pattern) AND
    (p_tags IS NULL OR tags && p_tags) AND
    (p_cache_type IS NULL OR cache_type = p_cache_type);
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

-- Cleanup expired cache entries
CREATE OR REPLACE FUNCTION public.cleanup_expired_cache()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM public.api_cache
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  
  -- Update stats
  UPDATE public.cache_stats
  SET evictions = evictions + v_deleted
  WHERE stat_date = CURRENT_DATE;
  
  RETURN v_deleted;
END;
$$;

-- Get cache statistics
CREATE OR REPLACE FUNCTION public.get_cache_statistics(
  p_days INTEGER DEFAULT 7
)
RETURNS TABLE (
  cache_type TEXT,
  total_entries BIGINT,
  total_hits BIGINT,
  total_misses BIGINT,
  hit_rate NUMERIC,
  avg_ttl INTEGER,
  total_size_mb NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.cache_type,
    COUNT(*)::BIGINT as total_entries,
    SUM(c.hit_count)::BIGINT as total_hits,
    SUM(c.miss_count)::BIGINT as total_misses,
    CASE 
      WHEN (SUM(c.hit_count) + SUM(c.miss_count)) > 0 
      THEN ROUND((SUM(c.hit_count)::NUMERIC / (SUM(c.hit_count) + SUM(c.miss_count))) * 100, 2)
      ELSE 0 
    END as hit_rate,
    AVG(c.ttl_seconds)::INTEGER as avg_ttl,
    ROUND(SUM(LENGTH(c.cache_value::TEXT))::NUMERIC / 1024 / 1024, 2) as total_size_mb
  FROM public.api_cache c
  WHERE c.created_at > NOW() - (p_days || ' days')::INTERVAL
  GROUP BY c.cache_type
  ORDER BY total_hits DESC;
END;
$$;

-- Get items due for warming
CREATE OR REPLACE FUNCTION public.get_warming_due()
RETURNS TABLE (
  config_key TEXT,
  endpoint TEXT,
  params JSONB,
  priority INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    w.config_key,
    w.endpoint,
    w.params,
    w.priority
  FROM public.cache_warming_config w
  WHERE 
    w.enabled = true AND
    (w.next_warmup_at IS NULL OR w.next_warmup_at <= NOW())
  ORDER BY w.priority DESC, w.next_warmup_at ASC NULLS FIRST
  LIMIT 50;
END;
$$;

-- Update warming status
CREATE OR REPLACE FUNCTION public.update_warming_status(
  p_config_key TEXT,
  p_success BOOLEAN,
  p_interval_minutes INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.cache_warming_config
  SET 
    last_warmed_at = NOW(),
    next_warmup_at = NOW() + (p_interval_minutes || ' minutes')::INTERVAL,
    success_count = CASE WHEN p_success THEN success_count + 1 ELSE success_count END,
    failure_count = CASE WHEN NOT p_success THEN failure_count + 1 ELSE failure_count END,
    updated_at = NOW()
  WHERE config_key = p_config_key;
END;
$$;

-- ============================================================================
-- Initial Cache Warming Configuration
-- ============================================================================
INSERT INTO public.cache_warming_config (config_key, endpoint, params, warmup_interval_minutes, priority)
VALUES 
  ('dashboard_summary', '/functions/v1/dashboard-summary', '{}'::jsonb, 5, 100),
  ('kb_popular_articles', '/functions/v1/rag-retrieve', '{"query": "popular", "limit": 10}'::jsonb, 15, 80),
  ('queue_stats', '/functions/v1/check-batch-status', '{}'::jsonb, 10, 60)
ON CONFLICT (config_key) DO NOTHING;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;