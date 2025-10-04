import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const consentId = url.searchParams.get('token');
    const leadId = url.searchParams.get('lead');
    const channel = url.searchParams.get('channel') || 'all'; // email, sms, phone, or all

    if (!consentId || !leadId) {
      return new Response(
        htmlPage('Invalid Request', 'Missing required parameters. Please contact support.'),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify the consent exists and belongs to the lead
    const { data: consent, error: fetchError } = await supabase
      .from('consents')
      .select('*')
      .eq('id', consentId)
      .eq('lead_id', leadId)
      .single();

    if (fetchError || !consent) {
      console.error('Consent not found:', fetchError);
      return new Response(
        htmlPage('Not Found', 'We could not find this consent record. It may have already been withdrawn.'),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
      );
    }

    // Check if already withdrawn
    if (consent.status === 'withdrawn') {
      return new Response(
        htmlPage(
          'Already Unsubscribed',
          'You have already unsubscribed from these communications. You will not receive further marketing messages.'
        ),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
      );
    }

    // Withdraw consent
    const { error: updateError } = await supabase
      .from('consents')
      .update({
        status: 'withdrawn',
        withdrawn_at: new Date().toISOString(),
        metadata: {
          ...consent.metadata,
          withdrawal_method: 'one_click_link',
          withdrawal_ip: req.headers.get('x-forwarded-for') || 'unknown',
          withdrawal_user_agent: req.headers.get('user-agent') || 'unknown',
        }
      })
      .eq('id', consentId);

    if (updateError) {
      console.error('Failed to withdraw consent:', updateError);
      return new Response(
        htmlPage('Error', 'An error occurred while processing your request. Please try again or contact support.'),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
      );
    }

    // Log audit event
    await supabase.from('audit_events').insert({
      event_type: 'consent_withdrawal',
      action: 'unsubscribe',
      resource_type: 'consent',
      resource_id: consentId,
      user_id: null,
      ip_address: req.headers.get('x-forwarded-for') || 'unknown',
      user_agent: req.headers.get('user-agent') || 'unknown',
      metadata: {
        lead_id: leadId,
        channel: channel,
        consent_type: consent.type,
        method: 'one_click_link',
      }
    });

    console.log('Consent withdrawn successfully:', { consentId, leadId, channel });

    return new Response(
      htmlPage(
        'Unsubscribed Successfully',
        `You have been unsubscribed from ${consent.type} communications via ${consent.channel || 'all channels'}. 
         You will not receive further marketing messages. 
         This change is effective immediately and complies with CASL requirements.`,
        true
      ),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
    );
  } catch (error: any) {
    console.error('Error in unsubscribe function:', error);
    return new Response(
      htmlPage('Error', 'An unexpected error occurred. Please contact support.'),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'text/html' },
      }
    );
  }
});

function htmlPage(title: string, message: string, success = false): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - AutoRepAi</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      max-width: 500px;
      width: 100%;
      padding: 40px;
      text-align: center;
    }
    .icon {
      width: 64px;
      height: 64px;
      margin: 0 auto 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
    }
    .success {
      background: #10b981;
      color: white;
    }
    .error {
      background: #ef4444;
      color: white;
    }
    .info {
      background: #3b82f6;
      color: white;
    }
    h1 {
      font-size: 24px;
      color: #111827;
      margin-bottom: 16px;
    }
    p {
      font-size: 16px;
      color: #6b7280;
      line-height: 1.6;
      margin-bottom: 24px;
    }
    .footer {
      font-size: 12px;
      color: #9ca3af;
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #e5e7eb;
    }
    .footer a {
      color: #667eea;
      text-decoration: none;
    }
    .footer a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon ${success ? 'success' : 'info'}">
      ${success ? '✓' : 'ℹ'}
    </div>
    <h1>${title}</h1>
    <p>${message}</p>
    <div class="footer">
      <p>
        <strong>AutoRepAi</strong><br>
        This action complies with Canada's Anti-Spam Legislation (CASL),
        the Telephone Consumer Protection Act (TCPA), and GDPR.
      </p>
      <p>
        Questions? <a href="mailto:compliance@autorepai.app">compliance@autorepai.app</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}
