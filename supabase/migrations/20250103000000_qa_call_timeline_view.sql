-- PHASE 3: QA view for last 50 calls with timeline markers
-- Provides deterministic testing view for receptionist live testing

CREATE OR REPLACE VIEW public.qa_call_timeline_summary AS
SELECT 
  cl.call_sid,
  cl.from_e164,
  cl.to_e164,
  cl.started_at,
  cl.ended_at,
  cl.status,
  cl.mode,
  -- Timeline markers (boolean flags)
  MAX(CASE WHEN ct.event = 'inbound_received' THEN 1 ELSE 0 END)::boolean AS has_inbound_received,
  MAX(CASE WHEN ct.event = 'twiml_sent' THEN 1 ELSE 0 END)::boolean AS has_twiml_sent,
  MAX(CASE WHEN ct.event = 'status_completed' THEN 1 ELSE 0 END)::boolean AS has_status_completed,
  MAX(CASE WHEN ct.event = 'recording_completed' THEN 1 ELSE 0 END)::boolean AS has_recording_completed,
  MAX(CASE WHEN ct.event = 'transcript_ready' THEN 1 ELSE 0 END)::boolean AS has_transcript_ready,
  MAX(CASE WHEN ct.event = 'recap_email_sent' THEN 1 ELSE 0 END)::boolean AS has_recap_email_sent,
  -- Timeline timestamps
  MIN(CASE WHEN ct.event = 'inbound_received' THEN ct.timestamp END) AS inbound_received_at,
  MIN(CASE WHEN ct.event = 'twiml_sent' THEN ct.timestamp END) AS twiml_sent_at,
  MIN(CASE WHEN ct.event = 'status_completed' THEN ct.timestamp END) AS status_completed_at,
  MIN(CASE WHEN ct.event = 'recording_completed' THEN ct.timestamp END) AS recording_completed_at,
  MIN(CASE WHEN ct.event = 'transcript_ready' THEN ct.timestamp END) AS transcript_ready_at,
  MIN(CASE WHEN ct.event = 'recap_email_sent' THEN ct.timestamp END) AS recap_email_sent_at,
  -- Event counts for debugging
  COUNT(DISTINCT ct.id) AS total_timeline_events
FROM public.call_logs cl
LEFT JOIN public.call_timeline ct ON cl.call_sid = ct.call_sid
WHERE cl.started_at >= NOW() - INTERVAL '7 days'
GROUP BY cl.call_sid, cl.from_e164, cl.to_e164, cl.started_at, cl.ended_at, cl.status, cl.mode
ORDER BY cl.started_at DESC
LIMIT 50;

-- Grant access to authenticated users
GRANT SELECT ON public.qa_call_timeline_summary TO authenticated;
GRANT SELECT ON public.qa_call_timeline_summary TO service_role;

COMMENT ON VIEW public.qa_call_timeline_summary IS 'QA view showing last 50 calls with timeline markers for deterministic testing';
