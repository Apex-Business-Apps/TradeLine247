import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Twilio from 'npm:twilio';

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
    const twilioClient = new Twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

    const subaccount = await twilioClient.api.accounts.create({
      friendlyName: `TradeLine-${tenantId}`
    });

    // 6. Purchase phone number (local to user's location)
    const availableNumbers = await twilioClient
      .availablePhoneNumbers(userLocation || 'US')
      .local
      .list({ limit: 1 });

    if (availableNumbers.length === 0) {
      // Rollback: Delete subaccount
      await twilioClient.api.accounts(subaccount.sid).remove();
      throw new Error('No available phone numbers in your area');
    }

    const purchasedNumber = await twilioClient
      .incomingPhoneNumbers
      .create({
        phoneNumber: availableNumbers[0].phoneNumber,
        voiceUrl: `${Deno.env.get('API_BASE_URL')}/webhooks/voice/${tenantId}`,
        smsUrl: `${Deno.env.get('API_BASE_URL')}/webhooks/sms/${tenantId}`,
        accountSid: subaccount.sid
      });

    // 7. Store in database
    const { data: newClient, error: dbError } = await supabase
      .from('clients')
      .insert({
        user_id: userId,
        tenant_id: tenantId,
        business_name: `Client ${userId.substring(0, 8)}`, // Auto-generated, can update later
        contact_email: userEmail,
        twilio_account_sid: subaccount.sid,
        twilio_auth_token: subaccount.authToken, // Will be encrypted by Supabase
        phone_number: purchasedNumber.phoneNumber
      })
      .select()
      .single();

    if (dbError) {
      // Rollback: Delete Twilio resources
      await twilioClient.incomingPhoneNumbers(purchasedNumber.sid).remove();
      await twilioClient.api.accounts(subaccount.sid).remove();
      throw dbError;
    }

    // 8. Return success
    return new Response(
      JSON.stringify({
        phoneNumber: purchasedNumber.phoneNumber,
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
