#!/usr/bin/env node

/**
 * Twilio Webhook Testing Script
 *
 * Simulates Twilio webhook payloads for development testing.
 * Can be used to test voice webhooks, status callbacks, and recording callbacks
 * without making actual calls to Twilio.
 *
 * Usage:
 *   node scripts/test-twilio-webhooks.mjs [webhook-type] [call-sid]
 *
 * Webhook types:
 *   - voice: Test inbound voice webhook
 *   - status: Test call status callback
 *   - recording: Test recording status callback
 *   - qa-view: Test QA view endpoint
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Environment setup
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Generate test CallSid
function generateCallSid() {
  return `CA${crypto.randomBytes(16).toString('hex').toUpperCase()}`;
}

// Generate Twilio signature for webhook validation
function generateTwilioSignature(url, params, authToken) {
  const sortedKeys = Object.keys(params).sort();
  let signatureString = url;

  for (const key of sortedKeys) {
    signatureString += key + params[key];
  }

  return crypto
    .createHmac('sha1', authToken)
    .update(signatureString, 'utf8')
    .digest('base64');
}

// Test inbound voice webhook
async function testVoiceWebhook(callSid = null) {
  const testCallSid = callSid || generateCallSid();
  const payload = {
    CallSid: testCallSid,
    From: '+15551234567',
    To: '+15559876543',
    CallerName: 'Test Caller',
    CallStatus: 'ringing'
  };

  console.log('🗣️  Testing inbound voice webhook...');
  console.log('Payload:', payload);

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/voice-incoming`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams(payload).toString()
    });

    const xmlResponse = await response.text();
    console.log('✅ Response status:', response.status);
    console.log('📄 TwiML Response:', xmlResponse);

    return testCallSid;
  } catch (error) {
    console.error('❌ Voice webhook test failed:', error);
    return null;
  }
}

// Test call status callback
async function testStatusCallback(callSid) {
  const payload = {
    CallSid: callSid,
    CallStatus: 'completed',
    CallDuration: '45',
    From: '+15551234567',
    To: '+15559876543',
    RecordingUrl: 'https://api.twilio.com/2010-04-01/Accounts/ACxxx/Recordings/RExxx.mp3'
  };

  console.log('📞 Testing call status callback...');

  if (!TWILIO_AUTH_TOKEN) {
    console.log('⚠️  Skipping signature validation (TWILIO_AUTH_TOKEN not set)');
    return;
  }

  const url = `${SUPABASE_URL}/functions/v1/voice-status-callback`;
  const signature = generateTwilioSignature(url, payload, TWILIO_AUTH_TOKEN);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Twilio-Signature': signature
      },
      body: new URLSearchParams(payload).toString()
    });

    const result = await response.json();
    console.log('✅ Status callback response:', result);

  } catch (error) {
    console.error('❌ Status callback test failed:', error);
  }
}

// Test recording status callback
async function testRecordingCallback(callSid) {
  const payload = {
    CallSid: callSid,
    RecordingSid: 'RE' + crypto.randomBytes(16).toString('hex').toUpperCase(),
    RecordingStatus: 'completed',
    RecordingUrl: 'https://api.twilio.com/2010-04-01/Accounts/ACxxx/Recordings/RExxx.mp3',
    RecordingDuration: '42',
    RecordingChannels: '1',
    RecordingSource: 'StartCallRecordingAPI'
  };

  console.log('🎵 Testing recording status callback...');

  if (!TWILIO_AUTH_TOKEN) {
    console.log('⚠️  Skipping signature validation (TWILIO_AUTH_TOKEN not set)');
    return;
  }

  const url = `${SUPABASE_URL}/functions/v1/voice-recording-callback`;
  const signature = generateTwilioSignature(url, payload, TWILIO_AUTH_TOKEN);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Twilio-Signature': signature
      },
      body: new URLSearchParams(payload).toString()
    });

    const result = await response.json();
    console.log('✅ Recording callback response:', result);

  } catch (error) {
    console.error('❌ Recording callback test failed:', error);
  }
}

// Test QA view
async function testQAView() {
  console.log('📊 Testing QA view...');

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/voice-qa-view`, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'apikey': SUPABASE_SERVICE_KEY
      }
    });

    const result = await response.json();
    console.log('✅ QA view response:');
    console.log('📈 Summary:', result.summary);
    console.log('📞 Recent calls:', result.calls?.length || 0);

  } catch (error) {
    console.error('❌ QA view test failed:', error);
  }
}

// Main execution
async function main() {
  const [,, webhookType, callSid] = process.argv;

  console.log('🚀 Twilio Webhook Testing Script');
  console.log('================================');

  switch (webhookType) {
    case 'voice':
      const newCallSid = await testVoiceWebhook(callSid);
      if (newCallSid) {
        console.log('💡 Use this CallSid for subsequent tests:', newCallSid);
      }
      break;

    case 'status':
      if (!callSid) {
        console.error('❌ CallSid required for status callback test');
        process.exit(1);
      }
      await testStatusCallback(callSid);
      break;

    case 'recording':
      if (!callSid) {
        console.error('❌ CallSid required for recording callback test');
        process.exit(1);
      }
      await testRecordingCallback(callSid);
      break;

    case 'qa-view':
      await testQAView();
      break;

    case 'full-flow':
      console.log('🔄 Testing complete call flow...');
      const testCallSid = await testVoiceWebhook();
      if (testCallSid) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s
        await testStatusCallback(testCallSid);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s
        await testRecordingCallback(testCallSid);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s
        await testQAView();
      }
      break;

    default:
      console.log('Usage: node scripts/test-twilio-webhooks.mjs [webhook-type] [call-sid]');
      console.log('');
      console.log('Webhook types:');
      console.log('  voice [call-sid]     - Test inbound voice webhook');
      console.log('  status <call-sid>    - Test call status callback');
      console.log('  recording <call-sid> - Test recording status callback');
      console.log('  qa-view              - Test QA monitoring view');
      console.log('  full-flow            - Test complete call flow');
      console.log('');
      console.log('Examples:');
      console.log('  node scripts/test-twilio-webhooks.mjs voice');
      console.log('  node scripts/test-twilio-webhooks.mjs status CA123456789');
      console.log('  node scripts/test-twilio-webhooks.mjs full-flow');
      break;
  }
}

main().catch(console.error);