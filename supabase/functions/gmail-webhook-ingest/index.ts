import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

interface GmailPushMessage {
  message: {
    data: string; // base64 encoded
    messageId: string;
    publishTime: string;
  };
  subscription: string;
}

interface GmailHistoryMessage {
  id: string;
  threadId: string;
  labelIds?: string[];
  snippet: string;
  payload?: {
    headers: Array<{ name: string; value: string }>;
    body?: { data?: string };
    parts?: any[];
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Parse Gmail push notification
    const gmailMessage: GmailPushMessage = await req.json();
    const decodedData = JSON.parse(atob(gmailMessage.message.data));

    // Extract history ID for incremental sync
    const historyId = decodedData.historyId;

    // Get Gmail access token (would be stored securely)
    // This is a placeholder - actual implementation would use OAuth refresh tokens
    const gmailAccessToken = await getGmailAccessToken(decodedData.emailAddress);

    // Fetch recent changes from Gmail
    const historyResponse = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/history?startHistoryId=${historyId}`,
      {
        headers: {
          'Authorization': `Bearer ${gmailAccessToken}`,
          'Accept': 'application/json',
        },
      }
    );

    if (!historyResponse.ok) {
      throw new Error(`Gmail API error: ${historyResponse.status}`);
    }

    const historyData = await historyResponse.json();

    // Process new/modified messages
    const processedEmails: string[] = [];

    for (const historyItem of historyData.history || []) {
      if (historyItem.messagesAdded) {
        for (const messageItem of historyItem.messagesAdded) {
          const messageId = messageItem.message.id;

          // Skip if already processed
          const { data: existing } = await supabase
            .from('email_messages')
            .select('id')
            .eq('message_id', messageId)
            .single();

          if (existing) continue;

          // Fetch full message details
          const messageDetails = await fetchMessageDetails(messageId, gmailAccessToken);

          if (messageDetails) {
            await processAndStoreEmail(messageDetails, supabase);
            processedEmails.push(messageId);
          }
        }
      }
    }

    // Log successful processing
    await supabase.from('ai_audit_log').insert({
      operation_type: 'gmail_webhook_processed',
      input_data: { historyId, processedEmails: processedEmails.length },
      output_data: { processedEmails },
      org_id: await getOrgIdFromEmail(decodedData.emailAddress, supabase)
    });

    return new Response(
      JSON.stringify({
        success: true,
        processedEmails: processedEmails.length,
        messageIds: processedEmails
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error('Gmail webhook processing failed:', error);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Log error
    await supabase.from('ai_audit_log').insert({
      operation_type: 'gmail_webhook_error',
      input_data: await req.json().catch(() => ({})),
      output_data: { error: error.message },
      org_id: null // Would need to extract from request
    });

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

async function getGmailAccessToken(emailAddress: string): Promise<string> {
  // Placeholder - actual implementation would:
  // 1. Look up refresh token for this email address from secure storage
  // 2. Exchange refresh token for access token using Gmail OAuth
  // 3. Return access token

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // This is a placeholder - actual implementation needed
  const { data: tokenData } = await supabase
    .from('gmail_tokens')
    .select('access_token, refresh_token, expires_at')
    .eq('email_address', emailAddress)
    .single();

  if (!tokenData) {
    throw new Error('No Gmail token found for email address');
  }

  // Check if token is expired and refresh if needed
  if (new Date(tokenData.expires_at) < new Date()) {
    // Refresh token logic here
    throw new Error('Token refresh not implemented');
  }

  return tokenData.access_token;
}

async function fetchMessageDetails(messageId: string, accessToken: string): Promise<GmailHistoryMessage | null> {
  const response = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    }
  );

  if (!response.ok) {
    console.error(`Failed to fetch message ${messageId}:`, response.status);
    return null;
  }

  return await response.json();
}

async function processAndStoreEmail(messageData: GmailHistoryMessage, supabase: any) {
  // Extract email headers
  const headers = messageData.payload?.headers || [];
  const getHeader = (name: string) => headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';

  const fromEmail = getHeader('From');
  const toEmails = getHeader('To') ? getHeader('To').split(',').map(e => e.trim()) : [];
  const subject = getHeader('Subject');
  const date = getHeader('Date');

  // Extract body text (simplified - actual implementation would handle MIME multipart)
  let bodyText = '';
  if (messageData.payload?.body?.data) {
    bodyText = atob(messageData.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
  } else if (messageData.payload?.parts) {
    // Handle multipart messages
    bodyText = extractTextFromParts(messageData.payload.parts);
  }

  // Get org/user from email address (simplified lookup)
  const orgId = await getOrgIdFromEmail(fromEmail, supabase);
  const userId = await getUserIdFromEmail(fromEmail, supabase);

  if (!orgId || !userId) {
    console.log(`Skipping email from ${fromEmail} - no org/user mapping found`);
    return;
  }

  // Store email message
  const { data: emailRecord, error: emailError } = await supabase
    .from('email_messages')
    .insert({
      org_id: orgId,
      user_id: userId,
      thread_id: messageData.threadId,
      message_id: messageData.id,
      from_email: fromEmail,
      to_emails: toEmails,
      subject: subject,
      body_text: bodyText,
      received_at: new Date(date || Date.now()).toISOString(),
      labels: messageData.labelIds || [],
      raw_json: messageData
    })
    .select()
    .single();

  if (emailError) {
    console.error('Failed to store email:', emailError);
    return;
  }

  // Queue for AI processing (could trigger immediately or use a job queue)
  await supabase.functions.invoke('email_process_ai', {
    body: { email_id: emailRecord.id }
  });
}

function extractTextFromParts(parts: any[]): string {
  // Simplified text extraction - actual implementation would handle various MIME types
  for (const part of parts) {
    if (part.mimeType === 'text/plain' && part.body?.data) {
      return atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
    }
    if (part.parts) {
      const nestedText = extractTextFromParts(part.parts);
      if (nestedText) return nestedText;
    }
  }
  return '';
}

async function getOrgIdFromEmail(email: string, supabase: any): Promise<string | null> {
  // Simplified - actual implementation would have proper email-to-org mapping
  const { data } = await supabase
    .from('user_email_mappings')
    .select('org_id')
    .eq('email', email)
    .single();

  return data?.org_id || null;
}

async function getUserIdFromEmail(email: string, supabase: any): Promise<string | null> {
  // Simplified - actual implementation would have proper email-to-user mapping
  const { data } = await supabase
    .from('user_email_mappings')
    .select('user_id')
    .eq('email', email)
    .single();

  return data?.user_id || null;
}