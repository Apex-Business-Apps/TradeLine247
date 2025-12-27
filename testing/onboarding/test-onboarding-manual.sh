#!/bin/bash
# One-Click Number Onboarding - Manual Testing Script
# Run this script to test the complete onboarding flow

set -e

# Configuration
SUPABASE_PROJECT_URL="${SUPABASE_PROJECT_URL:-https://your-project.supabase.co}"
SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY:-your-anon-key}"
TEST_EMAIL="${TEST_EMAIL:-test-$(date +%s)@tradeline247ai.com}"
TEST_PASSWORD="${TEST_PASSWORD:-test-password-123}"

echo "🧪 One-Click Number Onboarding - Manual Testing"
echo "================================================"

# Function to log test steps
log_step() {
    echo ""
    echo "📋 Step $1: $2"
    echo "----------------------------------------"
}

# Function to check command success
check_success() {
    if [ $? -eq 0 ]; then
        echo "✅ $1"
    else
        echo "❌ $1"
        exit 1
    fi
}

# Test 1: Supabase CLI Installation Check
log_step "1" "Checking Supabase CLI installation"
if command -v supabase &> /dev/null; then
    echo "✅ Supabase CLI found: $(supabase --version)"
else
    echo "❌ Supabase CLI not found. Install with: npm install -g supabase"
    exit 1
fi

# Test 2: Login to Supabase
log_step "2" "Logging into Supabase"
echo "Please login to Supabase CLI if not already logged in..."
supabase login
check_success "Supabase login"

# Test 3: Check Edge Function Deployment
log_step "3" "Checking Edge Function deployment"
if supabase functions list | grep -q "onboarding-provision"; then
    echo "✅ Edge Function 'onboarding-provision' is deployed"
else
    echo "❌ Edge Function not found. Deploy with:"
    echo "  supabase functions deploy onboarding-provision"
    exit 1
fi

# Test 4: Test Edge Function with Invalid Auth
log_step "4" "Testing Edge Function authentication"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$SUPABASE_PROJECT_URL/functions/v1/onboarding-provision" \
  -H "Content-Type: application/json" \
  -d '{"userId":"test","userEmail":"test@example.com"}')

if [ "$RESPONSE" = "401" ]; then
    echo "✅ Authentication properly rejected (401)"
else
    echo "❌ Expected 401, got $RESPONSE"
    exit 1
fi

# Test 5: Create Test User
log_step "5" "Creating test user"
USER_RESPONSE=$(curl -s \
  -X POST "$SUPABASE_PROJECT_URL/auth/v1/signup" \
  -H "Content-Type: application/json" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")

USER_ID=$(echo $USER_RESPONSE | jq -r '.user.id // empty')
if [ -z "$USER_ID" ]; then
    echo "❌ Failed to create test user"
    echo "Response: $USER_RESPONSE"
    exit 1
fi
echo "✅ Test user created: $USER_ID"

# Test 6: Get User Session Token
log_step "6" "Getting user session token"
SESSION_RESPONSE=$(curl -s \
  -X POST "$SUPABASE_PROJECT_URL/auth/v1/token?grant_type=password" \
  -H "Content-Type: application/json" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")

ACCESS_TOKEN=$(echo $SESSION_RESPONSE | jq -r '.access_token // empty')
if [ -z "$ACCESS_TOKEN" ]; then
    echo "❌ Failed to get access token"
    echo "Response: $SESSION_RESPONSE"
    exit 1
fi
echo "✅ Access token obtained"

# Test 7: Test Edge Function with Valid Auth (Missing Fields)
log_step "7" "Testing Edge Function with valid auth but missing fields"
RESPONSE=$(curl -s \
  -X POST "$SUPABASE_PROJECT_URL/functions/v1/onboarding-provision" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"userId":"'$USER_ID'"}')

HTTP_CODE=$(echo $RESPONSE | jq -r '.error // empty')
if echo "$RESPONSE" | jq -e '.error | test("Missing required fields")' > /dev/null; then
    echo "✅ Properly rejected missing userEmail"
else
    echo "❌ Expected validation error, got: $RESPONSE"
    exit 1
fi

# Test 8: Test Edge Function with Sandbox Credentials
log_step "8" "Testing Edge Function with sandbox credentials"
echo "⚠️  This test requires TWILIO_SANDBOX_MODE=true in Edge Function environment"
echo "    Set these environment variables in Supabase Dashboard:"
echo "    - TWILIO_SANDBOX_MODE: true"
echo "    - TWILIO_ACCOUNT_SID: your_sandbox_sid"
echo "    - TWILIO_AUTH_TOKEN: your_sandbox_token"

RESPONSE=$(curl -s \
  -X POST "$SUPABASE_PROJECT_URL/functions/v1/onboarding-provision" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"userId":"'$USER_ID'","userEmail":"'$TEST_EMAIL'","userLocation":"US"}')

if echo "$RESPONSE" | jq -e '.phoneNumber' > /dev/null; then
    PHONE_NUMBER=$(echo $RESPONSE | jq -r '.phoneNumber')
    echo "✅ Provisioning successful! Phone number: $PHONE_NUMBER"

    # Test 9: Verify Database Record
    log_step "9" "Verifying database record creation"
    DB_CHECK=$(curl -s \
      -X GET "$SUPABASE_PROJECT_URL/rest/v1/clients?user_id=eq.$USER_ID" \
      -H "apikey: $SUPABASE_ANON_KEY" \
      -H "Authorization: Bearer $ACCESS_TOKEN")

    if echo "$DB_CHECK" | jq -e '.[0].phone_number' > /dev/null; then
        echo "✅ Database record created successfully"
    else
        echo "❌ Database record not found"
        echo "Response: $DB_CHECK"
    fi

else
    echo "❌ Provisioning failed"
    echo "Response: $RESPONSE"

    # Check if it's a duplicate user error (expected on retry)
    if echo "$RESPONSE" | jq -e '.error | test("Client already exists")' > /dev/null; then
        echo "ℹ️  User already has a client record (this is expected on retry)"
    else
        echo "❌ Unexpected error - check Edge Function logs"
    fi
fi

# Test 10: Frontend Development Server Check
log_step "10" "Checking frontend development server"
if curl -s http://localhost:5173 > /dev/null; then
    echo "✅ Frontend dev server running on port 5173"
    echo "   → Open http://localhost:5173 to test the modal UI"
else
    echo "⚠️  Frontend dev server not running"
    echo "   → Start with: npm run dev"
fi

# Cleanup
log_step "11" "Cleaning up test data"
echo "Test user will remain for manual verification"
echo "To clean up manually:"
echo "  supabase auth admin delete-user $USER_ID"

echo ""
echo "🎉 Manual testing complete!"
echo ""
echo "📊 Test Results Summary:"
echo "   ✅ Supabase CLI installed"
echo "   ✅ Edge Function deployed"
echo "   ✅ Authentication validation"
echo "   ✅ Input validation"
echo "   ✅ Test user creation"
echo "   ⚠️  Sandbox provisioning (requires Twilio credentials)"
echo "   ⚠️  Frontend dev server (start with npm run dev)"
echo ""
echo "🚀 Next Steps:"
echo "   1. Set up Twilio sandbox credentials in Supabase"
echo "   2. Run frontend tests in browser"
echo "   3. Test mobile app integration"
echo "   4. Monitor Edge Function logs for errors"
