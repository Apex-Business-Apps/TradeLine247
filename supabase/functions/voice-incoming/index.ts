/* eslint-disable @typescript-eslint/no-explicit-any */
// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Test allowlist for receptionist mode (environment variable)
const TEST_ALLOWLIST = Deno.env.get("VOICE_TEST_ALLOWLIST")?.split(",") || [];

async function markVerified(toE164: string) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const url = new URL(`${supabaseUrl}/rest/v1/forwarding_checks`);
  url.searchParams.set("twilio_number_e164", `eq.${toE164}`);
  url.searchParams.set("status", "eq.pending");
  url.searchParams.set("order", "created_at.desc");
  url.searchParams.set("limit", "1");

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const { data: rows } = await supabase
    .from('forwarding_checks')
    .select('*')
    .eq('twilio_number_e164', toE164)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1);

  const row = rows?.[0];
  if (!row) return;

  await supabase
    .from('forwarding_checks')
    .update({
      status: "verified",
      verified_at: new Date().toISOString(),
      notes: "inbound detected",
    })
    .eq('id', row.id);
}

async function logInboundCall(callData: any) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  await supabase.from('call_lifecycle').insert({
    call_sid: callData.CallSid,
    from_number: callData.From,
    to_number: callData.To,
    status: 'inbound_webhook',
    direction: 'inbound',
    meta: {
      user_agent: callData.CallerName || null,
      forwarded_from: callData.ForwardedFrom || null,
      receptionist_mode: callData.receptionistMode,
      timestamp: new Date().toISOString()
    },
    updated_at: new Date().toISOString()
  });

  // Log analytics event
  await supabase.from('analytics_events').insert({
    event_type: 'twilio_inbound_webhook',
    event_data: {
      call_sid: callData.CallSid,
      from: callData.From,
      to: callData.To,
      receptionist_mode: callData.receptionistMode,
      timestamp: new Date().toISOString()
    },
    severity: 'info'
  });
}

function isTestNumber(fromNumber: string): boolean {
  // Normalize phone number (remove + and spaces)
  const normalized = fromNumber.replace(/^\+/, '').replace(/\s/g, '');
  return TEST_ALLOWLIST.some(testNum => {
    const normalizedTest = testNum.replace(/^\+/, '').replace(/\s/g, '');
    return normalized === normalizedTest || normalized.endsWith(normalizedTest);
  });
}

export default async (req: Request) => {
  const body = await req.text();
  const p = new URLSearchParams(body);
  const callData: {
    CallSid: string;
    From: string;
    To: string;
    CallerName: string | null;
    ForwardedFrom: string | null;
    receptionistMode?: boolean;
  } = {
    CallSid: p.get("CallSid") || "",
    From: p.get("From") || "",
    To: p.get("To") || "",
    CallerName: p.get("CallerName") || null,
    ForwardedFrom: p.get("ForwardedFrom") || null
  };

  // Mark forwarding as verified
  markVerified(callData.To).catch(() => null);

  // Determine if this should use receptionist mode
  const receptionistMode = isTestNumber(callData.From);
  callData.receptionistMode = receptionistMode;

  // Log inbound webhook events (async, don't block response)
  logInboundCall(callData).catch((err: unknown) => console.error('Failed to log inbound call:', err));

  // Log timeline events
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Log inbound_received
  const { error: timelineError } = await supabase.from('call_timeline').insert({
    call_sid: callData.CallSid,
    event: 'inbound_received',
    timestamp: new Date().toISOString(),
    metadata: {
      from_number: callData.From,
      to_number: callData.To,
      receptionist_mode: callData.receptionistMode
    }
  });
  if (timelineError) console.error('Failed to log inbound_received:', timelineError);

  let xml: string;

  if (receptionistMode) {
    // Route to AI receptionist
    console.log(`🤖 Routing ${callData.CallSid} to AI receptionist (test allowlist)`);
    xml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="wss://${new URL(req.url).host}/functions/v1/voice-stream?callSid=${callData.CallSid}" />
  </Connect>
</Response>`;
  } else {
    // Standard forwarding flow
    console.log(`📞 Standard forwarding for ${callData.CallSid}`);
    xml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Welcome to TradeLine. Your forwarding is active.</Say>
</Response>`;
  }

  // Log twiml_sent event
  const { error: twimlError } = await supabase.from('call_timeline').insert({
    call_sid: callData.CallSid,
    event: 'twiml_sent',
    timestamp: new Date().toISOString(),
    metadata: {
      receptionist_mode: callData.receptionistMode,
      xml_length: xml.length
    }
  });
  if (twimlError) console.error('Failed to log twiml_sent:', twimlError);

  return new Response(xml, { headers: { "Content-Type": "text/xml" } });
};