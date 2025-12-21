# CURL Payload Replayers - Local Simulation

## PHASE 4: Exact curl payload replayers for local simulation

These curl commands simulate Twilio webhook payloads for local testing.

### Prerequisites

1. Get your Twilio auth token: `TWILIO_AUTH_TOKEN`
2. Get your Supabase function URL: `SUPABASE_URL`
3. Compute HMAC-SHA1 signature (see signature generation below)

### Signature Generation

Twilio signatures are computed as:
```
HMAC-SHA1(TWILIO_AUTH_TOKEN, URL + sorted_params)
```

**Note**: For local testing with `ALLOW_INSECURE_TWILIO_WEBHOOKS=true`, signatures can be bypassed in non-production.

### 1. Incoming Call Webhook (`/voice-answer`)

```bash
# Simulate incoming call
curl -X POST "${SUPABASE_URL}/functions/v1/voice-answer" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "X-Twilio-Signature: [COMPUTED_SIGNATURE]" \
  -d "CallSid=CA1234567890abcdef1234567890abcdef" \
  -d "From=%2B15551234567" \
  -d "To=%2B15877428885" \
  -d "AnsweredBy=human"

# Expected: TwiML response with <Response>, <Gather>, <Connect><Stream>, or <Dial>
```

### 2. Status Callback (`/voice-status-callback`)

#### Status: Initiated (queued)

```bash
curl -X POST "${SUPABASE_URL}/functions/v1/voice-status-callback" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "X-Twilio-Signature: [COMPUTED_SIGNATURE]" \
  -d "CallSid=CA1234567890abcdef1234567890abcdef" \
  -d "CallStatus=queued" \
  -d "StatusCallbackEvent=initiated" \
  -d "From=%2B15551234567" \
  -d "To=%2B15877428885"

# Expected: {"success": true}
```

#### Status: Ringing

```bash
curl -X POST "${SUPABASE_URL}/functions/v1/voice-status-callback" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "X-Twilio-Signature: [COMPUTED_SIGNATURE]" \
  -d "CallSid=CA1234567890abcdef1234567890abcdef" \
  -d "CallStatus=ringing" \
  -d "StatusCallbackEvent=ringing" \
  -d "From=%2B15551234567" \
  -d "To=%2B15877428885"

# Expected: {"success": true}
```

#### Status: Answered (in-progress)

```bash
curl -X POST "${SUPABASE_URL}/functions/v1/voice-status-callback" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "X-Twilio-Signature: [COMPUTED_SIGNATURE]" \
  -d "CallSid=CA1234567890abcdef1234567890abcdef" \
  -d "CallStatus=in-progress" \
  -d "StatusCallbackEvent=answered" \
  -d "From=%2B15551234567" \
  -d "To=%2B15877428885"

# Expected: {"success": true}
```

#### Status: Completed

```bash
curl -X POST "${SUPABASE_URL}/functions/v1/voice-status-callback" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "X-Twilio-Signature: [COMPUTED_SIGNATURE]" \
  -d "CallSid=CA1234567890abcdef1234567890abcdef" \
  -d "CallStatus=completed" \
  -d "StatusCallbackEvent=completed" \
  -d "CallDuration=120" \
  -d "From=%2B15551234567" \
  -d "To=%2B15877428885"

# Expected: {"success": true}
# Timeline: Should create status_completed marker
```

### 3. Recording Callback (`/voice-recording-callback`)

#### Recording: In-Progress

```bash
curl -X POST "${SUPABASE_URL}/functions/v1/voice-recording-callback" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "X-Twilio-Signature: [COMPUTED_SIGNATURE]" \
  -d "CallSid=CA1234567890abcdef1234567890abcdef" \
  -d "RecordingSid=RE1234567890abcdef1234567890abcdef" \
  -d "RecordingStatus=in-progress" \
  -d "RecordingDuration=0"

# Expected: {"success": true, "status": "in-progress", ...}
```

#### Recording: Completed

```bash
curl -X POST "${SUPABASE_URL}/functions/v1/voice-recording-callback" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "X-Twilio-Signature: [COMPUTED_SIGNATURE]" \
  -d "CallSid=CA1234567890abcdef1234567890abcdef" \
  -d "RecordingSid=RE1234567890abcdef1234567890abcdef" \
  -d "RecordingStatus=completed" \
  -d "RecordingUrl=https://api.twilio.com/2010-04-01/Accounts/AC.../Recordings/RE..." \
  -d "RecordingDuration=120" \
  -d "RecordingChannels=2" \
  -d "RecordingSource=DialVerb"

# Expected: {"success": true, "status": "completed", ...}
# Timeline: Should create recording_completed marker
# Should enqueue transcription task
```

#### Recording: Absent

```bash
curl -X POST "${SUPABASE_URL}/functions/v1/voice-recording-callback" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "X-Twilio-Signature: [COMPUTED_SIGNATURE]" \
  -d "CallSid=CA1234567890abcdef1234567890abcdef" \
  -d "RecordingSid=RE1234567890abcdef1234567890abcdef" \
  -d "RecordingStatus=absent"

# Expected: {"success": true, "status": "absent", ...}
```

### 4. Testing Idempotency

Send the same payload twice:

```bash
# First request
curl -X POST "${SUPABASE_URL}/functions/v1/voice-status-callback" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "X-Twilio-Signature: [COMPUTED_SIGNATURE]" \
  -d "CallSid=CA1234567890abcdef1234567890abcdef" \
  -d "CallStatus=completed" \
  -d "StatusCallbackEvent=completed" \
  -d "CallDuration=120"

# Second identical request (should be idempotent)
curl -X POST "${SUPABASE_URL}/functions/v1/voice-status-callback" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "X-Twilio-Signature: [COMPUTED_SIGNATURE]" \
  -d "CallSid=CA1234567890abcdef1234567890abcdef" \
  -d "CallStatus=completed" \
  -d "StatusCallbackEvent=completed" \
  -d "CallDuration=120"

# Expected: Both return {"success": true}
# Database: Should not create duplicate timeline events
```

### 5. Testing Signature Validation

#### Invalid Signature

```bash
curl -X POST "${SUPABASE_URL}/functions/v1/voice-answer" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "X-Twilio-Signature: invalid_signature" \
  -d "CallSid=CA1234567890abcdef1234567890abcdef" \
  -d "From=%2B15551234567" \
  -d "To=%2B15877428885"

# Expected: 401 Unauthorized or 403 Forbidden
```

#### Missing Signature

```bash
curl -X POST "${SUPABASE_URL}/functions/v1/voice-answer" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "CallSid=CA1234567890abcdef1234567890abcdef" \
  -d "From=%2B15551234567" \
  -d "To=%2B15877428885"

# Expected: 401 Unauthorized or 403 Forbidden
```

### 6. Testing Event Filtering

#### Non-Configured Status Event (should be ignored)

```bash
curl -X POST "${SUPABASE_URL}/functions/v1/voice-status-callback" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "X-Twilio-Signature: [COMPUTED_SIGNATURE]" \
  -d "CallSid=CA1234567890abcdef1234567890abcdef" \
  -d "CallStatus=failed"

# Expected: {"success": true, "ignored": true}
# Should not create timeline events
```

#### Failed Recording Status (should be ignored)

```bash
curl -X POST "${SUPABASE_URL}/functions/v1/voice-recording-callback" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "X-Twilio-Signature: [COMPUTED_SIGNATURE]" \
  -d "CallSid=CA1234567890abcdef1234567890abcdef" \
  -d "RecordingSid=RE1234567890abcdef1234567890abcdef" \
  -d "RecordingStatus=failed"

# Expected: {"success": true, "ignored": true}
# Should not process (failed not in configured events)
```

### Verification

After running these curl commands, verify:

1. **Database Check**:
   ```sql
   SELECT * FROM call_timeline WHERE call_sid = 'CA1234567890abcdef1234567890abcdef' ORDER BY timestamp;
   ```

2. **QA View Check**:
   ```sql
   SELECT * FROM qa_call_timeline_summary WHERE call_sid = 'CA1234567890abcdef1234567890abcdef';
   ```

3. **Idempotency Check**:
   ```sql
   SELECT call_sid, event, COUNT(*) as count 
   FROM call_timeline 
   WHERE call_sid = 'CA1234567890abcdef1234567890abcdef'
   GROUP BY call_sid, event 
   HAVING COUNT(*) > 1;
   -- Should return no rows (no duplicates)
   ```
