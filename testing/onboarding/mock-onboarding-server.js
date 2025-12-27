/**
 * Mock Onboarding Server for Development Testing
 * Simulates the Supabase Edge Function without real Twilio API calls
 *
 * Usage:
 *   node testing/onboarding/mock-onboarding-server.js
 *   # Then test with: curl http://localhost:3001/api/onboarding/provision
 */

const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Mock responses
const MOCK_RESPONSES = {
  SUCCESS: {
    phoneNumber: '+15551234567',
    twilioAccountSid: 'AC_mock_subaccount_123',
    tenantId: 'client-mockuser'
  },

  DUPLICATE_USER: {
    error: 'Client already exists',
    phoneNumber: '+15551111111'
  },

  TWILIO_ERROR: {
    error: 'No available phone numbers in your area'
  },

  NETWORK_ERROR: {
    error: 'Provisioning failed',
    details: 'Network timeout'
  }
};

// Mock user database (in-memory)
const mockUsers = new Set();
const mockClients = new Map();

// Mock authentication middleware
function mockAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.substring(7);

  // Simple token validation (in real app, verify JWT)
  if (token.length < 10) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  // Extract mock user ID from token (simplified)
  req.user = {
    id: token.includes('test-user') ? 'test-user-123' : 'user-' + Date.now(),
    email: 'test@example.com'
  };

  next();
}

// Validation middleware
function validateRequest(req, res, next) {
  const { userId, userEmail } = req.body;

  if (!userId || !userEmail) {
    return res.status(400).json({
      error: 'Missing required fields: userId, userEmail'
    });
  }

  if (!userEmail.includes('@')) {
    return res.status(400).json({
      error: 'Invalid email format'
    });
  }

  next();
}

// Main provisioning endpoint
app.post('/api/onboarding/provision', mockAuth, validateRequest, (req, res) => {
  const { userId, userEmail, userLocation = 'US' } = req.body;

  console.log(`📞 Provisioning request for user: ${userId}, email: ${userEmail}`);

  // Simulate processing delay
  setTimeout(() => {
    // Check for duplicate client
    if (mockClients.has(userId)) {
      console.log('❌ Duplicate user detected');
      return res.status(400).json(MOCK_RESPONSES.DUPLICATE_USER);
    }

    // Simulate random failures (10% chance)
    if (Math.random() < 0.1) {
      const errors = [MOCK_RESPONSES.TWILIO_ERROR, MOCK_RESPONSES.NETWORK_ERROR];
      const randomError = errors[Math.floor(Math.random() * errors.length)];
      console.log('❌ Simulated error:', randomError.error);
      return res.status(500).json(randomError);
    }

    // Generate mock tenant ID
    const tenantId = `client-${userId.substring(0, 8)}`;

    // Create mock client record
    const clientData = {
      user_id: userId,
      tenant_id: tenantId,
      business_name: `Client ${userId.substring(0, 8)}`,
      contact_email: userEmail,
      twilio_account_sid: MOCK_RESPONSES.SUCCESS.twilioAccountSid,
      phone_number: MOCK_RESPONSES.SUCCESS.phoneNumber,
      created_at: new Date().toISOString()
    };

    mockClients.set(userId, clientData);

    console.log('✅ Provisioning successful:', {
      phoneNumber: clientData.phone_number,
      tenantId: clientData.tenant_id
    });

    res.json({
      phoneNumber: clientData.phone_number,
      twilioAccountSid: clientData.twilio_account_sid,
      tenantId: clientData.tenant_id
    });

  }, 2000 + Math.random() * 3000); // 2-5 second delay
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    mockClientsCount: mockClients.size,
    timestamp: new Date().toISOString()
  });
});

// Clear mock data endpoint
app.post('/reset', (req, res) => {
  mockClients.clear();
  mockUsers.clear();
  res.json({ message: 'Mock data cleared' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Mock Onboarding Server running on http://localhost:${PORT}`);
  console.log('');
  console.log('📋 Available endpoints:');
  console.log(`   POST http://localhost:${PORT}/api/onboarding/provision`);
  console.log(`   GET  http://localhost:${PORT}/health`);
  console.log(`   POST http://localhost:${PORT}/reset`);
  console.log('');
  console.log('🧪 Test commands:');
  console.log(`   curl -X POST http://localhost:${PORT}/api/onboarding/provision \\`);
  console.log(`     -H "Authorization: Bearer mock-token-123" \\`);
  console.log(`     -H "Content-Type: application/json" \\`);
  console.log(`     -d '{"userId":"test-user-123","userEmail":"test@example.com","userLocation":"US"}'`);
  console.log('');
  console.log('⚠️  This is for development testing only!');
  console.log('    Production uses real Supabase Edge Functions with Twilio API.');
});
