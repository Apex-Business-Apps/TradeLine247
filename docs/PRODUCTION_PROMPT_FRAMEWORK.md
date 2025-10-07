# Production-Ready Prompt Framework

## How to Ask for Real, Working Features

Use this framework when requesting ANY feature to ensure you get production-ready, tested, working code.

---

## THE PROMPT TEMPLATE

```
TASK: [Your feature request]

REAL-WORLD VERIFICATION REQUIRED:
Before claiming success, you MUST verify:

1. BROWSER TESTING:
   - Feature loads without console errors
   - All UI elements render correctly
   - User interactions work as expected
   - Mobile responsive (test viewport)

2. AUTHENTICATION FLOW:
   - Login/logout works
   - Protected routes redirect properly
   - User state persists on refresh
   - No auth tokens in console/URLs

3. DATABASE OPERATIONS:
   - Data saves to Supabase (verify in dashboard)
   - RLS policies block anonymous access
   - Queries return expected data
   - No SQL errors in logs

4. SECURITY VALIDATION:
   - No secrets in client code
   - No VITE_ environment variables
   - RLS policies tested (anonymous + authenticated)
   - Input validation prevents injection

5. ERROR HANDLING:
   - Network failures show user-friendly messages
   - Form validation displays errors
   - Edge cases don't crash the app
   - Loading states exist for async operations

6. PERFORMANCE:
   - Page loads in <3 seconds
   - No memory leaks (check DevTools)
   - Images optimized
   - No unnecessary re-renders

PROVIDE EVIDENCE:
- Link to Supabase tables showing data
- Link to Edge Function logs (if applicable)
- Screenshot proof of feature working
- Console log confirmation (if relevant)

FAILURE CONDITIONS (Do NOT claim success if):
- Console shows ANY errors related to this feature
- Feature only works "in theory" but hasn't been tested
- You haven't verified in Supabase dashboard
- RLS policies not tested with anonymous user
- Any hardcoded secrets present
- TypeScript errors exist

SUCCESS CRITERIA:
- Feature works in REAL browser
- Data persists in Supabase (dashboard verified)
- No console errors
- Security audit passes
- User can complete the full flow
- Code follows existing patterns

CONSTRAINTS:
- Use existing design system (index.css tokens)
- Follow existing code architecture
- No VITE_ environment variables
- All secrets in Supabase secrets manager
- Edge functions for API keys
- Proper TypeScript types
- Accessibility standards (WCAG AA)

IF YOU CANNOT VERIFY:
State clearly: "I cannot verify [X] without user testing. Please test and confirm."
DO NOT claim it works if you haven't verified it.
```

---

## EXAMPLE USAGE

### ❌ BAD PROMPT:
"Add a chat feature"

### ✅ GOOD PROMPT:
```
TASK: Add AI chat feature for lead conversations

REAL-WORLD VERIFICATION REQUIRED:
1. Chat widget appears on leads page
2. Messages save to Supabase `interactions` table (verify in dashboard)
3. AI responses stream without errors
4. RLS allows only assigned sales rep to see messages
5. Rate limiting prevents abuse

PROVIDE EVIDENCE:
- Link to interactions table with test messages
- Link to ai-chat Edge Function logs showing successful responses
- Confirmation that anonymous user cannot access chat

FAILURE CONDITIONS:
- Messages don't persist after refresh
- AI calls fail with 401/429 errors
- Chat accessible to unauthenticated users

SUCCESS CRITERIA:
- Sales rep can send message and get AI response
- Conversation persists on page refresh
- Other users cannot see private conversations
- LOVABLE_API_KEY never exposed to client

CONSTRAINTS:
- Use existing message UI patterns
- Stream responses token-by-token
- Handle network failures gracefully
```

---

## KEY PRINCIPLES

### 1. DEMAND PROOF, NOT PROMISES
- "I've added the feature" ❌
- "Feature added. Verify at: [Supabase table link]" ✅

### 2. TEST SECURITY EXPLICITLY
- Always test as anonymous user
- Verify RLS blocks unauthorized access
- Check browser DevTools for leaked secrets

### 3. VALIDATE IN SUPABASE DASHBOARD
- Open tables and see actual data
- Check Edge Function logs for errors
- Review RLS policies are active

### 4. BREAK DOWN COMPLEX REQUESTS
- Don't ask for "complete CRM system"
- Ask for "lead creation form with Supabase storage"
- Then "lead list with RLS filtering"
- Then "lead assignment to sales reps"

### 5. SPECIFY THE USER FLOW
```
USER FLOW:
1. Visitor fills lead form
2. Form validates email/phone
3. Data saves to `leads` table
4. Confirmation email sent via Edge Function
5. Lead appears in CRM inbox

VERIFY EACH STEP WORKS.
```

---

## DEBUGGING PROMPTS

When stuck:

```
DIAGNOSIS REQUIRED:

1. SEARCH CODEBASE:
   - Where is [feature] implemented?
   - What files reference [function/component]?

2. CHECK LOGS:
   - Console errors mentioning [feature]
   - Network requests to [endpoint]
   - Supabase Edge Function logs for [function-name]

3. VERIFY DATABASE:
   - Does table [table_name] exist?
   - What RLS policies are on [table_name]?
   - Show me actual data in [table_name]

4. REPRODUCE:
   - Test as anonymous user
   - Test as authenticated user
   - Check mobile viewport
   - Try with network throttling

DO NOT GUESS. INVESTIGATE FIRST.
```

---

## PRODUCTION DEPLOYMENT PROMPT

```
PRODUCTION READINESS CHECK:

Run these validations:
1. Security scan (no secrets exposed)
2. RLS policies block anonymous on sensitive tables
3. All Edge Functions have proper error handling
4. Forms have input validation
5. Error boundaries catch React errors
6. Images have alt text (accessibility)
7. No TypeScript errors
8. No console.error in production code
9. Service Worker registered (if applicable)
10. Custom domain configured (if needed)

PROVIDE:
- Link to security scan results
- Link to test deployment
- Confirmation all items pass

DO NOT DEPLOY if ANY item fails.
```

---

## ANTI-PATTERNS TO AVOID

### ❌ Don't Say:
- "This should work"
- "The feature is implemented"
- "I've added the code"

### ✅ Do Say:
- "Feature verified: [evidence]"
- "Tested in browser: [result]"
- "Supabase shows data: [dashboard link]"
- "Known limitation: [specific issue]"

---

## SUMMARY

**Before ANY feature is "done", answer:**

1. ✅ Did I test it in a real browser?
2. ✅ Did I verify data in Supabase dashboard?
3. ✅ Did I check console for errors?
4. ✅ Did I test as anonymous + authenticated user?
5. ✅ Did I verify Edge Function logs (if applicable)?
6. ✅ Did I confirm no secrets are exposed?
7. ✅ Did I provide links for user to verify?

**If you can't answer YES to all, you're not done.**

---

## Use This Framework

Copy the prompt template above and fill in your specific requirements. This ensures you get working, production-ready code every time.
