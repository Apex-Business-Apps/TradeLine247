# Golden Call Checklist - Receptionist Live Testing

## PHASE 4: Deterministic Testing Guide

This checklist ensures receptionist live testing is deterministic without adding new infrastructure.

### Prerequisites

1. **Twilio Console Configuration**
   - Voice webhook URL: `https://[PROJECT].supabase.co/functions/v1/voice-answer`
   - Status callback URL: `https://[PROJECT].supabase.co/functions/v1/voice-status-callback`
   - Status callback events: `initiated`, `ringing`, `answered`, `completed`
   - Recording status callback URL: `https://[PROJECT].supabase.co/functions/v1/voice-recording-callback`
   - Recording status callback events: `in-progress`, `completed`, `absent` (default: `completed`)

2. **Environment Variables**
   - `TWILIO_AUTH_TOKEN`: Twilio auth token for signature validation
   - `SUPABASE_URL`: Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Service role key for database access
   - `BUSINESS_TARGET_E164`: Forward target in E.164 format

### Golden Call Timeline

A successful call should have these timeline markers in `call_timeline` table:

1. ✅ **inbound_received** - Call received by `/voice-answer`
2. ✅ **twiml_sent** - TwiML response sent to Twilio
3. ✅ **status_completed** - Call status changed to `completed`
4. ✅ **recording_completed** - Recording finished (if recording enabled)
5. ✅ **transcript_ready** - Transcript available (if transcription enabled)
6. ✅ **recap_email_sent** - Recap email sent (if email enabled)

### QA View Query

```sql
-- View last 50 calls with timeline markers
SELECT * FROM qa_call_timeline_summary
ORDER BY started_at DESC
LIMIT 50;
```

### Verification Checklist

- [ ] Call appears in `call_logs` with `call_sid`
- [ ] `inbound_received` timeline marker exists
- [ ] `twiml_sent` timeline marker exists
- [ ] Status callbacks received: `initiated`, `ringing`, `answered`, `completed`
- [ ] `status_completed` timeline marker exists
- [ ] Recording callbacks received (if recording enabled): `in-progress`, `completed`
- [ ] `recording_completed` timeline marker exists (if recording enabled)
- [ ] No duplicate timeline events (idempotency verified)
- [ ] Signature validation passed (check logs for "✅ Twilio signature validated successfully")

### Common Issues

1. **Missing timeline markers**: Check webhook delivery in Twilio Console
2. **Duplicate events**: Verify idempotency keys in timeline metadata
3. **Signature validation failures**: Check `X-Twilio-Signature` header and proxy URL reconstruction
4. **Recording loops**: Verify `record="record-from-answer"` only on `<Dial>`, not on `<Connect><Stream>`
