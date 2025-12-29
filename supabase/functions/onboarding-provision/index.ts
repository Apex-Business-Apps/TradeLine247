import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID');
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');

// Twilio REST API helper
const callTwilioAPI = async (
  endpoint: string,
  method: string,
  accountSid: string,
  authToken: string,
  body?: Record<string, string>
) => {
  const url = `https://api.twilio.com/2010-04-01${endpoint}`;
  const auth = btoa(`${accountSid}:${authToken}`);

  const options: RequestInit = {
    method,
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  };

  if (body && method === 'POST') {
    options.body = new URLSearchParams(body).toString();
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Twilio API error: ${error}`);
  }

  return response.json();
};

serve(async (req) => {
  try {
    // 1. Verify authentication
    const authHeader = req.headers.get('Authorization')!;
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    // 2. Parse request
    const { userId, userEmail, userLocation } = await req.json();

    // 3. Check existing client
    const { data: existingClient } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (existingClient) {
      return new Response(
        JSON.stringify({
          error: 'Client already exists',
          phoneNumber: existingClient.phone_number
        }),
        { status: 400 }
      );
    }

    // 4. Generate tenant ID
    const tenantId = `client-${userId.substring(0, 8)}`;

    // 5. Create Twilio subaccount
    const subaccount = await callTwilioAPI(
      '/Accounts.json',
      'POST',
      TWILIO_ACCOUNT_SID!,
      TWILIO_AUTH_TOKEN!,
      { FriendlyName: `TradeLine-${tenantId}` }
    );

    // 6. Find available numbers
    const availableNumbersResponse = await callTwilioAPI(
      `/Accounts/${TWILIO_ACCOUNT_SID}/AvailablePhoneNumbers/${userLocation || 'US'}/Local.json?Limit=1`,
      'GET',
      TWILIO_ACCOUNT_SID!,
      TWILIO_AUTH_TOKEN!
    );

    if (!availableNumbersResponse.available_phone_numbers || availableNumbersResponse.available_phone_numbers.length === 0) {
      throw new Error('No available phone numbers in your area');
    }

    const availableNumber = availableNumbersResponse.available_phone_numbers[0];

    // 7. Purchase number
    const purchasedNumber = await callTwilioAPI(
      `/Accounts/${subaccount.sid}/IncomingPhoneNumbers.json`,
      'POST',
      subaccount.sid,
      subaccount.auth_token,
      {
        PhoneNumber: availableNumber.phone_number,
        VoiceUrl: `${Deno.env.get('API_BASE_URL')}/webhooks/voice/${tenantId}`,
        SmsUrl: `${Deno.env.get('API_BASE_URL')}/webhooks/sms/${tenantId}`
      }
    );

    // 8. Store in database
    const { data: newClient, error: dbError } = await supabase
      .from('clients')
      .insert({
        user_id: userId,
        tenant_id: tenantId,
        business_name: `Client ${userId.substring(0, 8)}`,
        contact_email: userEmail,
        twilio_account_sid: subaccount.sid,
        twilio_auth_token: subaccount.auth_token,
        phone_number: purchasedNumber.phone_number
      })
      .select()
      .single();

    if (dbError) {
      // Rollback Twilio resources
      try {
        await callTwilioAPI(
          `/Accounts/${subaccount.sid}/IncomingPhoneNumbers/${purchasedNumber.sid}.json`,
          'DELETE',
          subaccount.sid,
          subaccount.auth_token
        );
        await callTwilioAPI(
          `/Accounts/${subaccount.sid}.json`,
          'DELETE',
          TWILIO_ACCOUNT_SID!,
          TWILIO_AUTH_TOKEN!
        );
      } catch (rollbackError) {
        console.error('Rollback failed:', rollbackError);
      }
      throw dbError;
    }

    // 9. Return success
    return new Response(
      JSON.stringify({
        phoneNumber: purchasedNumber.phone_number,
        twilioAccountSid: subaccount.sid,
        tenantId
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error('Provisioning error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Provisioning failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
