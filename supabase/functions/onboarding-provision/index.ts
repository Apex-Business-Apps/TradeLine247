import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID');
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');
const TWILIO_MASTER_SUBACCOUNT_SID = Deno.env.get('TWILIO_MASTER_SUBACCOUNT_SID');

serve(async (req) => {
  try {
    // 1. Verify user authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 2. Parse request body
    const { userId, userEmail, userLocation } = await req.json();

    if (!userId || !userEmail) {
      return new Response(JSON.stringify({ error: 'Missing required fields: userId, userEmail' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 3. Check if user already has a client record
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
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 4. Generate tenant ID
    const tenantId = `client-${userId.substring(0, 8)}`;

    // 5. Create Twilio subaccount
    const subaccountResponse = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          FriendlyName: `TradeLine-${tenantId}`
        })
      }
    );
    const subaccount = await subaccountResponse.json();

    // 6. Purchase phone number (local to user's location)
    const availableNumbersResponse = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/AvailablePhoneNumbers/${userLocation || 'US'}/Local.json?Limit=1`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`
        }
      }
    );
    const { available_phone_numbers } = await availableNumbersResponse.json();

    if (available_phone_numbers.length === 0) {
      // Rollback: Delete subaccount
      await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${subaccount.sid}.json`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`
          }
        }
      );
      throw new Error('No available phone numbers in your area');
    }

    const purchaseResponse = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${subaccount.sid}/IncomingPhoneNumbers.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${subaccount.sid}:${subaccount.auth_token}`)}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          PhoneNumber: available_phone_numbers[0].phone_number,
          VoiceUrl: `${Deno.env.get('API_BASE_URL')}/webhooks/voice/${tenantId}`,
          SmsUrl: `${Deno.env.get('API_BASE_URL')}/webhooks/sms/${tenantId}`
        })
      }
    );
    const purchasedNumber = await purchaseResponse.json();

    // 7. Store in database
    const { data: newClient, error: dbError } = await supabase
      .from('clients')
      .insert({
        user_id: userId,
        tenant_id: tenantId,
        business_name: `Client ${userId.substring(0, 8)}`, // Auto-generated, can update later
        contact_email: userEmail,
        twilio_account_sid: subaccount.sid,
        twilio_auth_token: subaccount.auth_token, // Will be encrypted by Supabase
        phone_number: purchasedNumber.phone_number
      })
      .select()
      .single();

    if (dbError) {
      // Rollback: Delete Twilio resources
      await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${subaccount.sid}/IncomingPhoneNumbers/${purchasedNumber.sid}.json`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Basic ${btoa(`${subaccount.sid}:${subaccount.auth_token}`)}`
          }
        }
      );
      await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${subaccount.sid}.json`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`
          }
        }
      );
      throw dbError;
    }

    // 8. Return success
    return new Response(
      JSON.stringify({
        phoneNumber: purchasedNumber.phone_number,
        twilioAccountSid: subaccount.sid,
        tenantId
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Provisioning error:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Provisioning failed',
        details: error.stack
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});
