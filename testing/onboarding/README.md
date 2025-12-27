# One-Click Number Onboarding - Testing Infrastructure

This directory contains comprehensive testing tools for the one-click number onboarding system.

## 🧪 Testing Overview

The testing infrastructure includes:
- **Unit tests** for components and utilities
- **Integration tests** for API endpoints
- **Manual testing scripts** for end-to-end verification
- **Mock servers** for development testing
- **Monitoring and deployment** guides

## 📋 Quick Start

### 1. Run Manual Tests
```bash
# Make script executable
chmod +x testing/onboarding/test-onboarding-manual.sh

# Run comprehensive manual tests
./testing/onboarding/test-onboarding-manual.sh
```

### 2. Start Mock Server for Development
```bash
# Install dependencies (if not already installed)
npm install express cors

# Start mock onboarding server
node testing/onboarding/mock-onboarding-server.js
```

### 3. Test Frontend Integration
```bash
# Start development server
npm run dev

# Open browser to http://localhost:5173
# Navigate to dashboard and click "Add Number"
# Test the modal flow
```

## 🧪 Test Categories

### Unit Tests (`test-onboarding-flow.ts`)
- Component rendering tests
- State management tests
- Form validation tests
- Error handling tests
- Performance benchmarks

### Integration Tests (Manual Script)
- Edge Function deployment verification
- Authentication flow testing
- API endpoint validation
- Database record creation
- Twilio integration (sandbox mode)

### End-to-End Tests
- Complete user journey testing
- Mobile responsiveness
- Error recovery flows
- Performance monitoring

## 🛠️ Mock Server Usage

The mock server simulates the Supabase Edge Function without requiring real Twilio credentials.

### Starting the Server
```bash
node testing/onboarding/mock-onboarding-server.js
```

### Available Endpoints

#### POST `/api/onboarding/provision`
Simulates phone number provisioning.

**Request:**
```json
{
  "userId": "test-user-123",
  "userEmail": "test@example.com",
  "userLocation": "US"
}
```

**Success Response:**
```json
{
  "phoneNumber": "+15551234567",
  "twilioAccountSid": "AC_mock_subaccount_123",
  "tenantId": "client-testuser"
}
```

#### GET `/health`
Returns server status and mock data counts.

#### POST `/reset`
Clears all mock data for fresh testing.

### Testing with Mock Server
```bash
# Test successful provisioning
curl -X POST http://localhost:3001/api/onboarding/provision \
  -H "Authorization: Bearer mock-token-123" \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-user-123","userEmail":"test@example.com","userLocation":"US"}'

# Test duplicate user
curl -X POST http://localhost:3001/api/onboarding/provision \
  -H "Authorization: Bearer mock-token-123" \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-user-123","userEmail":"test@example.com","userLocation":"US"}'

# Check server health
curl http://localhost:3001/health
```

## 🔧 Manual Testing Script

The `test-onboarding-manual.sh` script provides automated testing of:

1. **Supabase CLI** installation and login
2. **Edge Function** deployment status
3. **Authentication** validation
4. **Input validation** for required fields
5. **Test user** creation and session management
6. **Provisioning flow** with sandbox credentials
7. **Database verification** of created records
8. **Frontend development** server status

### Prerequisites for Manual Testing
- Supabase CLI installed
- Logged into Supabase
- Edge Function deployed
- Twilio sandbox credentials configured (optional)

### Running Manual Tests
```bash
# Set environment variables (optional)
export SUPABASE_PROJECT_URL="https://your-project.supabase.co"
export SUPABASE_ANON_KEY="your-anon-key"
export TEST_EMAIL="test-$(date +%s)@example.com"

# Run the test script
./testing/onboarding/test-onboarding-manual.sh
```

## 📊 Monitoring & Deployment

See `deploy-monitoring.md` for:
- Production deployment procedures
- Monitoring dashboard setup
- Alert configuration
- Rollback procedures
- Performance optimization tips

## 🐛 Common Issues & Solutions

### Mock Server Issues
```
Error: Cannot find module 'express'
```
**Solution:**
```bash
npm install express cors
```

### Supabase CLI Issues
```
Error: Not logged in to Supabase
```
**Solution:**
```bash
supabase login
```

### Edge Function Not Deployed
```
Error: Function 'onboarding-provision' not found
```
**Solution:**
```bash
supabase functions deploy onboarding-provision
```

### Twilio Sandbox Not Configured
```
Error: Provisioning failed
```
**Solution:** Either configure sandbox credentials or use the mock server for testing.

## 🎯 Testing Checklist

### Pre-Deployment
- [ ] Mock server tests pass
- [ ] Manual testing script completes successfully
- [ ] Frontend integration works in development
- [ ] Error handling tested for all scenarios
- [ ] Mobile responsiveness verified

### Staging Environment
- [ ] Edge Function deployed to staging
- [ ] Sandbox Twilio credentials configured
- [ ] Real user testing completed
- [ ] Performance benchmarks met
- [ ] Monitoring alerts configured

### Production Launch
- [ ] Production Twilio credentials configured
- [ ] Load testing completed (50+ concurrent users)
- [ ] Rollback procedures tested
- [ ] Customer support trained
- [ ] Success monitoring active

## 📈 Performance Benchmarks

### Target Metrics
- **Provisioning Time:** < 10 seconds average
- **Success Rate:** > 98%
- **Error Recovery:** > 95% of failed attempts succeed on retry
- **Mobile Compatibility:** Works on iOS 14+ and Android 8+

### Monitoring Queries
```sql
-- Success rate over last 24 hours
SELECT
  COUNT(*) FILTER (WHERE error IS NULL) * 100.0 / COUNT(*) as success_rate
FROM onboarding_logs
WHERE created_at >= NOW() - INTERVAL '24 hours';

-- Average provisioning time
SELECT AVG(duration_ms) / 1000 as avg_seconds
FROM onboarding_logs
WHERE success = true
  AND created_at >= NOW() - INTERVAL '24 hours';
```

## 🚀 Next Steps

1. **Run mock server tests** to verify basic functionality
2. **Execute manual testing script** for integration verification
3. **Test frontend integration** in development environment
4. **Configure staging environment** with sandbox credentials
5. **Perform load testing** before production deployment
6. **Set up monitoring** and alerting for production

This testing infrastructure ensures your one-click onboarding system is reliable, performant, and ready for production use.
