# Support

## User Support

### Contact Methods

- **AI Concierge (24/7):** In-app chat at the bottom right corner. See the [AI Concierge FAQ](./docs/AI_CONCIERGE_FAQ.md) for usage tips and supported scenarios.
- **Email:** info@tradeline247ai.com
- **Phone:** +1-587-742-8885

### Response Times

- **Critical (service down):** 2 hours (AI concierge will page the on-call team automatically.)
- **High (major feature broken):** 8 hours
- **Normal (questions, minor issues):** 24 hours
- **Low (feature requests, enhancements):** 48 hours

### AI Concierge Coverage

- **Supported Languages:** English, French, Spanish, and Tagalog. The concierge auto-detects locale from the conversation and will request clarification if the intent is unclear.
- **Transcript Delivery:** Full chat transcripts are emailed to the account owner and CC'd to support@tradeline247ai.com within five minutes of session close. Marketing receives a weekly digest generated from the same transcript feed.
- **Human Escalation:** Conversations flagged as critical or unresolved after three concierge replies are transferred to Tier 1 support. Customers can also type `agent` at any point to request an immediate handoff.

## Operator Support (Internal)

### Diagnostic Steps

1. **Start with evidence dashboard:** `/ops/twilio-evidence`
   - Check P95 handshake latency
   - Check fallback rate
   - Review recent call/message status

2. **Check Twilio Console:** [Debugger](https://console.twilio.com/us1/monitor/debugger)
   - Search by CallSid or MessageSid
   - Review webhook delivery status
   - Check error codes

3. **Check Database:**
   ```sql
   -- Recent calls
   SELECT * FROM calls ORDER BY created_at DESC LIMIT 10;
   
   -- Recent SMS
   SELECT * FROM sms_reply_logs ORDER BY created_at DESC LIMIT 10;
   
   -- Stream fallbacks
   SELECT * FROM voice_stream_logs WHERE fell_back = true ORDER BY created_at DESC LIMIT 10;
   ```

### Escalation Ladder

**Tier 1 (First Responder)**
- Verify incident via `/ops/twilio-evidence`
- Check Twilio Debugger for webhook errors
- Document CallSid/MessageSid, timestamp, endpoint

**Tier 2 (Development)**
- Review edge function logs in Supabase
- Check for signature verification failures
- Review database constraints and RLS policies

**Tier 3 (Infrastructure)**
- Review Supabase service health
- Check Twilio account status
- Investigate DNS/network issues

### Known Issues

See [GitHub Issues](https://github.com/apex-business-systems/tradeline247/issues) for tracked bugs and feature requests.

### Documentation

- [Voice Implementation](./REALTIME_VOICE_IMPLEMENTATION.md)
- [Delta Fix Verification](./DELTA_FIX_VERIFICATION.md)
- [Security Architecture](./SECURITY_ARCHITECTURE.md)

## Community

Join [GitHub Discussions](https://github.com/apex-business-systems/tradeline247/discussions) for:
- Feature requests
- General questions
- Best practices
- Integrations

---

**Apex Business Systems**  
Edmonton, AB, Canada  
info@tradeline247ai.com

