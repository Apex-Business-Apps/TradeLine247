-- Create call_timeline table for tracking voice call events
CREATE TABLE IF NOT EXISTS public.call_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_sid TEXT NOT NULL,
  event TEXT NOT NULL, -- 'inbound_received', 'twiml_sent', 'status_event', 'recording_completed', 'transcript_ready', 'recap_email_sent'
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',

  -- Indexes for efficient querying
  CONSTRAINT call_timeline_call_sid_event_timestamp_unique UNIQUE (call_sid, event, timestamp)
);

-- Enable RLS
ALTER TABLE public.call_timeline ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users only
CREATE POLICY "Users can view call timeline" ON public.call_timeline
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Service role can manage call timeline" ON public.call_timeline
  FOR ALL USING (auth.role() = 'service_role');

-- Create indexes
CREATE INDEX idx_call_timeline_call_sid ON public.call_timeline(call_sid);
CREATE INDEX idx_call_timeline_event ON public.call_timeline(event);
CREATE INDEX idx_call_timeline_timestamp ON public.call_timeline(timestamp DESC);

-- Add comments
COMMENT ON TABLE public.call_timeline IS 'Tracks timeline events for voice calls';
COMMENT ON COLUMN public.call_timeline.call_sid IS 'Twilio CallSid for correlation';
COMMENT ON COLUMN public.call_timeline.event IS 'Event type: inbound_received, twiml_sent, status_event, recording_completed, transcript_ready, recap_email_sent';
COMMENT ON COLUMN public.call_timeline.timestamp IS 'When the event occurred';
COMMENT ON COLUMN public.call_timeline.metadata IS 'Additional event-specific data';