-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Custom types
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'user', 'viewer');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE ai_output_type AS ENUM ('summary', 'tags', 'draft_reply');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE source_type AS ENUM ('email', 'call', 'booking');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE booking_status AS ENUM ('scheduled', 'confirmed', 'completed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE reminder_channel AS ENUM ('sms', 'voice', 'email', 'push');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE reminder_status AS ENUM ('pending', 'sent', 'failed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Core RAG tables with RLS policies

-- Organizations table (if not exists)
CREATE TABLE IF NOT EXISTS orgs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Users table (extend existing auth.users if needed)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'org_id') THEN
    ALTER TABLE auth.users ADD COLUMN org_id uuid REFERENCES orgs(id);
  END IF;
EXCEPTION
  WHEN others THEN null;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'role') THEN
    ALTER TABLE auth.users ADD COLUMN role user_role DEFAULT 'user';
  END IF;
EXCEPTION
  WHEN others THEN null;
END $$;

-- Email messages table
CREATE TABLE email_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  thread_id text NOT NULL,
  message_id text UNIQUE NOT NULL,
  from_email text NOT NULL,
  to_emails jsonb NOT NULL DEFAULT '[]',
  subject text,
  body_text text,
  received_at timestamptz NOT NULL DEFAULT now(),
  labels jsonb DEFAULT '[]',
  raw_json jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Email chunks for RAG
CREATE TABLE email_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_id uuid NOT NULL REFERENCES email_messages(id) ON DELETE CASCADE,
  chunk_index integer NOT NULL,
  content text NOT NULL,
  embedding vector(1536), -- OpenAI text-embedding-ada-002 dimension
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Email AI outputs
CREATE TABLE email_ai_outputs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_id uuid NOT NULL REFERENCES email_messages(id) ON DELETE CASCADE,
  type ai_output_type NOT NULL,
  content text NOT NULL,
  sources jsonb DEFAULT '[]', -- References to chunks used
  model_info jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Calls table
CREATE TABLE calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  twilio_call_sid text UNIQUE NOT NULL,
  from_number text NOT NULL,
  to_number text NOT NULL,
  started_at timestamptz,
  ended_at timestamptz,
  recording_url text,
  status text DEFAULT 'processing',
  raw_json jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Call transcripts
CREATE TABLE call_transcripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  call_id uuid NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
  transcript_text text NOT NULL,
  stt_provider text DEFAULT 'twilio',
  confidence jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Call chunks for RAG
CREATE TABLE call_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  call_id uuid NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
  chunk_index integer NOT NULL,
  content text NOT NULL,
  embedding vector(1536),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Tasks table (unified task management)
CREATE TABLE tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_type source_type NOT NULL,
  source_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  due_at timestamptz,
  status task_status DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Bookings table
CREATE TABLE bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  customer_name text NOT NULL,
  customer_phone text,
  customer_email text,
  start_at timestamptz NOT NULL,
  end_at timestamptz,
  notes text,
  status booking_status DEFAULT 'scheduled',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Reminders table
CREATE TABLE reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  channel reminder_channel NOT NULL,
  scheduled_for timestamptz NOT NULL,
  sent_at timestamptz,
  status reminder_status DEFAULT 'pending',
  provider_ids jsonb DEFAULT '{}',
  last_error text,
  created_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_email_messages_org_user ON email_messages(org_id, user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_email_messages_thread ON email_messages(thread_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_email_messages_received ON email_messages(received_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_email_chunks_org_user ON email_chunks(org_id, user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_email_chunks_email ON email_chunks(email_id);

-- HNSW indexes for vector search (high performance)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_email_chunks_embedding ON email_chunks USING hnsw (embedding vector_cosine_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_call_chunks_embedding ON call_chunks USING hnsw (embedding vector_cosine_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_calls_org_user ON calls(org_id, user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_calls_twilio_sid ON calls(twilio_call_sid);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_org_user ON tasks(org_id, user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_due ON tasks(due_at) WHERE due_at IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_status ON tasks(status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_org ON bookings(org_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_start ON bookings(start_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reminders_scheduled ON reminders(scheduled_for);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reminders_status ON reminders(status);

-- Row Level Security (RLS) policies
ALTER TABLE orgs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_ai_outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

-- RLS Policies (org-scoped access)
CREATE POLICY "orgs_access" ON orgs FOR ALL USING (true);

CREATE POLICY "email_messages_org_access" ON email_messages
  FOR ALL USING (org_id IN (
    SELECT org_id FROM auth.users WHERE id = auth.uid()
  ));

CREATE POLICY "email_chunks_org_access" ON email_chunks
  FOR ALL USING (org_id IN (
    SELECT org_id FROM auth.users WHERE id = auth.uid()
  ));

CREATE POLICY "email_ai_outputs_org_access" ON email_ai_outputs
  FOR ALL USING (org_id IN (
    SELECT org_id FROM auth.users WHERE id = auth.uid()
  ));

CREATE POLICY "calls_org_access" ON calls
  FOR ALL USING (org_id IN (
    SELECT org_id FROM auth.users WHERE id = auth.uid()
  ));

CREATE POLICY "call_transcripts_org_access" ON call_transcripts
  FOR ALL USING (org_id IN (
    SELECT org_id FROM auth.users WHERE id = auth.uid()
  ));

CREATE POLICY "call_chunks_org_access" ON call_chunks
  FOR ALL USING (org_id IN (
    SELECT org_id FROM auth.users WHERE id = auth.uid()
  ));

CREATE POLICY "tasks_org_access" ON tasks
  FOR ALL USING (org_id IN (
    SELECT org_id FROM auth.users WHERE id = auth.uid()
  ));

CREATE POLICY "bookings_org_access" ON bookings
  FOR ALL USING (org_id IN (
    SELECT org_id FROM auth.users WHERE id = auth.uid()
  ));

CREATE POLICY "reminders_org_access" ON reminders
  FOR ALL USING (org_id IN (
    SELECT org_id FROM auth.users WHERE id = auth.uid()
  ));

-- Helper RPC functions for vector search
CREATE OR REPLACE FUNCTION match_email_chunks(
  query_org_id uuid,
  query_user_id uuid,
  query_embedding vector(1536),
  match_count int DEFAULT 6,
  similarity_threshold float DEFAULT 0.7
)
RETURNS TABLE(
  id uuid,
  email_id uuid,
  chunk_index int,
  content text,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validate user has access to this org
  IF NOT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = query_user_id AND org_id = query_org_id
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT
    ec.id,
    ec.email_id,
    ec.chunk_index,
    ec.content,
    1 - (ec.embedding <=> query_embedding) as similarity
  FROM email_chunks ec
  WHERE ec.org_id = query_org_id
    AND ec.user_id = query_user_id
    AND 1 - (ec.embedding <=> query_embedding) > similarity_threshold
  ORDER BY ec.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

CREATE OR REPLACE FUNCTION match_call_chunks(
  query_org_id uuid,
  query_embedding vector(1536),
  match_count int DEFAULT 6,
  similarity_threshold float DEFAULT 0.7
)
RETURNS TABLE(
  id uuid,
  call_id uuid,
  chunk_index int,
  content text,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validate user belongs to org
  IF NOT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() AND org_id = query_org_id
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT
    cc.id,
    cc.call_id,
    cc.chunk_index,
    cc.content,
    1 - (cc.embedding <=> query_embedding) as similarity
  FROM call_chunks cc
  WHERE cc.org_id = query_org_id
    AND 1 - (cc.embedding <=> query_embedding) > similarity_threshold
  ORDER BY cc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Function to get embeddings (placeholder - will be implemented in Edge Functions)
CREATE OR REPLACE FUNCTION get_embedding(text_input text)
RETURNS vector(1536)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This will be called from Edge Functions with actual embedding API
  -- For now, return a zero vector as placeholder
  RETURN '[0]'::vector;
END;
$$;

-- Audit logging for AI operations
CREATE TABLE ai_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  operation_type text NOT NULL, -- 'email_draft', 'call_summary', 'reminder_sent', etc.
  input_data jsonb,
  output_data jsonb,
  sources_used jsonb DEFAULT '[]',
  model_info jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ai_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_audit_org_access" ON ai_audit_log
  FOR ALL USING (org_id IN (
    SELECT org_id FROM auth.users WHERE id = auth.uid()
  ));

-- Updated at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_email_messages_updated_at
  BEFORE UPDATE ON email_messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calls_updated_at
  BEFORE UPDATE ON calls
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Feature flags for gradual rollout
CREATE TABLE feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE,
  feature_name text NOT NULL,
  enabled boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(org_id, feature_name)
);

ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feature_flags_org_access" ON feature_flags
  FOR ALL USING (org_id IN (
    SELECT org_id FROM auth.users WHERE id = auth.uid()
  ));

-- Insert default feature flags
INSERT INTO feature_flags (org_id, feature_name, enabled) VALUES
  (NULL, 'RAG_FEATURE_ENABLED', false),
  (NULL, 'EMAIL_AI_ENABLED', false),
  (NULL, 'CALL_AI_ENABLED', false),
  (NULL, 'REMINDERS_ENABLED', false);