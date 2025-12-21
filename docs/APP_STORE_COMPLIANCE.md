# App Store Compliance Documentation

**TradeLine 24/7 - Voice AI Assistant**
**Version:** 1.0
**Last Updated:** 2025-12-20

---

## Privacy Policy

**Privacy Policy URL:** https://www.tradeline247ai.com/privacy

The privacy policy is linked in:
- App Store metadata
- Settings screen within the app
- Call initiation disclosure
- Marketing emails (footer)

---

## Data Collection & Handling

### What We Collect

| Data Type | When Collected | Storage | Retention |
|-----------|---------------|---------|-----------|
| Caller ID (number) | Every call | Supabase | 180 days |
| Caller Name | If publicly available | Supabase | 180 days |
| Call Category | Every call | Supabase | 180 days |
| Redacted Summary | Every call | Supabase | 180 days |
| Full Transcript | Consent granted only | Supabase | 90 days |
| Audio Recording | Consent granted only | Private bucket | 30 days |
| Email Address | When provided | Supabase | Until opt-out |
| Consent Flags | Every interaction | Supabase | Permanent (audit) |

### NO-RECORD MODE

When explicit recording consent is **not** granted (or jurisdiction is unknown), TradeLine 24/7 automatically enters **NO-RECORD MODE**:

**What IS stored:**
- `caller_id_number` - Phone number (for callback capability)
- `caller_id_name` - If publicly available (caller ID lookup)
- `call_category` - One of: `customer_service`, `lead_capture`, `prospect_call`
- `redacted_summary` - AI-generated summary with all PII removed

**What is NOT stored:**
- Full conversation transcript
- Audio recording
- Personal details mentioned during the call
- Business-specific information shared verbally

**Implementation:**
```typescript
// NO-RECORD MODE triggers when:
// 1. Consent explicitly denied
// 2. Consent state unknown
// 3. Jurisdiction with stricter requirements detected

if (consent_state !== 'granted') {
  recording_mode = 'no_record';
  // Only persist: caller_id, call_category, redacted_summary
}
```

---

## Consent Management

### Recording Consent Flow

1. **Disclosure**: "This call may be recorded for quality purposes"
2. **Explicit Request**: "Is that okay with you?"
3. **Response Handling**:
   - **YES**: Full recording mode enabled
   - **NO**: NO-RECORD MODE activated
   - **Unclear/No Response**: NO-RECORD MODE (fail-closed)

### SMS/Marketing Consent

- SMS follow-up requires separate explicit opt-in
- Opt-in must be clear and voluntary
- Opt-in status stored in `consents` table
- Marketing emails include one-click unsubscribe

### Consent Revocation Path

Users can revoke consent at any time through:

1. **During Call**: Say "stop recording" or "don't record this"
   - Immediately switches to NO-RECORD MODE
   - Existing recording segment is deleted

2. **Via App Settings**:
   - Navigate to Settings > Privacy
   - Toggle off "Allow Call Recording"
   - Changes take effect immediately

3. **Via Email**:
   - Reply STOP to any marketing message
   - Contact privacy@tradeline247ai.com
   - Processed within 24 hours

4. **Via Phone**:
   - Request removal during any call
   - Say "remove my data" or "opt out"
   - Logged to `compliance_events` table

### Data Subject Rights (PIPEDA/GDPR Compatible)

| Right | How to Exercise | Response Time |
|-------|----------------|---------------|
| Access | Email privacy@tradeline247ai.com | 30 days |
| Correction | Email or in-app | 7 days |
| Deletion | Email or say "delete my data" | 30 days |
| Portability | Email request | 30 days |
| Opt-Out | Any channel (immediate) | Immediate |

---

## Quiet Hours Compliance

Outbound communications (calls, SMS, emails) are restricted:

- **Allowed Hours**: 08:00 - 21:00 local time at recipient's location
- **Unknown Timezone**: Schedule for 10:00 AM business timezone, flag for review
- **Holidays**: Reduced outreach, `needs_review=true`

---

## Data Retention & Deletion

### Automatic Retention

| Data Type | Retention Period | After Expiry |
|-----------|-----------------|--------------|
| Call metadata | 180 days | Anonymized |
| Transcripts | 90 days | Deleted |
| Audio recordings | 30 days | Deleted |
| Consent records | Permanent | Audit trail |
| Suppression list | Permanent | Compliance |

### Manual Deletion

- Users may request deletion at any time
- Deletion requests logged to `compliance_events`
- Data purged within 30 days (some metadata retained for audit)

### Anonymization

After retention period:
- Personal identifiers removed
- Statistical aggregates may be retained
- Cannot be re-linked to individual

---

## Suppression & DNC Lists

### Internal Suppression

The `suppressions` table tracks:
- Users who requested no contact
- Bounced phone numbers
- Complaint sources
- Regulatory DNC matches

### Compliance Checks

Before any outreach:
```sql
SELECT 1 FROM suppressions
WHERE (identifier = :phone_or_email)
  AND (channel = :outreach_channel OR channel = 'all')
  AND (expires_at IS NULL OR expires_at > NOW());
```

---

## App Store Specific Requirements

### Apple App Store

- **App Tracking Transparency**: Not applicable (no cross-app tracking)
- **Privacy Nutrition Labels**: Accurately reflect data collection
- **Sign in with Apple**: Not required (B2B app)
- **Kids Category**: Not applicable (business app)

### Google Play Store

- **Data Safety Section**: Matches privacy policy
- **Permissions**: Microphone (for calls), Notifications
- **Background Data**: Minimal (push notifications only)

---

## Audit Trail

All compliance-relevant events are logged to `compliance_events`:

```sql
CREATE TABLE compliance_events (
  id UUID PRIMARY KEY,
  call_id TEXT,
  event_type TEXT NOT NULL,
  reason TEXT,
  details JSONB,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

Event types include:
- `consent_granted` / `consent_denied`
- `no_record_mode_activated`
- `opt_out_received`
- `data_deletion_requested`
- `suppression_added`
- `followup_blocked`

---

## Contact

**Privacy Inquiries:**
privacy@tradeline247ai.com

**Data Protection Officer:**
Apex Business Systems
Edmonton, AB, Canada

**Regulatory Complaints:**
Office of the Privacy Commissioner of Canada
https://www.priv.gc.ca

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-12-20 | Initial compliance documentation |
