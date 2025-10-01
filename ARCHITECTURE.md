# AutoRepAi Architecture

## System Overview

AutoRepAi is an enterprise-grade, compliance-first dealership AI platform built on React + TypeScript + Supabase.

## Tech Stack

### Frontend
- **Framework**: React 18 + TypeScript + Vite
- **UI Components**: Radix UI + Tailwind CSS
- **Routing**: React Router v6
- **State Management**: React Query (TanStack Query)
- **Forms**: React Hook Form + Zod validation
- **Styling**: Tailwind CSS with custom design tokens

### Backend
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Supabase Auth
- **Edge Functions**: Deno runtime on Supabase
- **AI**: Lovable AI Gateway (Google Gemini 2.5 Flash)
- **Real-time**: Supabase Realtime (WebSockets)

### Mobile
- **PWA**: Manifest + Service Workers (planned)
- **Native**: Capacitor (iOS/Android) (planned)

## Database Schema

### Core Tables

#### `organizations`
- Multi-tenant org structure
- Jurisdiction settings for compliance
- Timezone/locale configuration

#### `dealerships`
- Multiple dealerships per organization
- License tracking (OMVIC, AMVIC, VSA, etc.)
- Contact information

#### `profiles`
- Extends `auth.users`
- User metadata and preferences
- Linked to organization/dealership

#### `user_roles`
- **Security-first**: Separate table to prevent privilege escalation
- Role-based access control (RBAC)
- Supports: super_admin, org_admin, dealer_admin, sales_manager, sales_rep, finance_manager, viewer

#### `leads`
- Lead capture and tracking
- Source attribution
- AI scoring (0-100)
- Assignment and status workflow

#### `interactions`
- Omnichannel communication log
- Types: chat, sms, whatsapp, email, phone_call
- AI-generated flag for compliance

#### `vehicles`
- Inventory management
- VIN and stock number tracking
- Pricing and specifications
- Multi-source sync ready

#### `quotes`
- Version-controlled quotes
- Canadian tax calculations
- E2EE PDF generation support
- Expiry and view tracking

#### `credit_applications`
- Adaptive forms (solo/co-applicant)
- Consent timestamp logging
- Soft/hard pull tracking
- External integration ready

#### `consents`
- **Compliance-first**: Explicit consent tracking
- Types: marketing, sms, phone, email, TCPA, CASL, GDPR
- Jurisdiction-aware
- IP address and user agent logging
- Withdrawal tracking

#### `documents`
- E2EE file storage
- Share tokens with expiry
- Revocation support
- Type categorization

#### `audit_events`
- Append-only audit log
- Resource tracking
- IP and user agent capture
- Compliance reporting

### Security Features

#### Row Level Security (RLS)
- Enabled on all tables
- Organization-scoped queries
- Security definer functions to prevent recursion
- User role checking via `has_role()` function

#### Security Definer Functions
```sql
has_role(_user_id UUID, _role user_role) -> boolean
get_user_organization(_user_id UUID) -> UUID
```

## Application Structure

```
src/
├── components/
│   ├── Layout/
│   │   └── AppLayout.tsx          # Main app shell with sidebar
│   ├── Auth/
│   │   └── ProtectedRoute.tsx     # Auth guard wrapper
│   ├── Chat/
│   │   └── AIChatWidget.tsx       # AI assistant chat interface
│   ├── Forms/
│   │   └── LeadCaptureForm.tsx    # Lead capture with consent
│   ├── Quote/
│   │   └── QuoteCalculator.tsx    # Canadian tax calculator
│   └── ui/                        # Radix UI components
├── pages/
│   ├── Index.tsx                  # Landing page
│   ├── Auth.tsx                   # Sign in/up
│   ├── Dashboard.tsx              # Main dashboard
│   ├── Leads.tsx                  # Lead management
│   ├── Inventory.tsx              # Vehicle inventory
│   ├── Quotes.tsx                 # Quote list
│   ├── QuoteBuilder.tsx           # Quote calculator
│   ├── CreditApps.tsx             # Credit applications
│   ├── Inbox.tsx                  # Omnichannel inbox
│   └── Settings.tsx               # System settings
├── lib/
│   ├── taxCalculator.ts           # Canadian tax logic
│   └── utils.ts                   # Utility functions
├── types/
│   └── database.ts                # TypeScript types
└── integrations/
    └── supabase/
        ├── client.ts              # Supabase client
        └── types.ts               # Auto-generated DB types
```

## AI Integration

### Lovable AI Gateway
- **Model**: google/gemini-2.5-flash (default)
- **Endpoint**: https://ai.gateway.lovable.dev/v1/chat/completions
- **Authentication**: Automatic via LOVABLE_API_KEY secret
- **Use Cases**:
  - Lead qualification
  - Customer inquiry responses
  - Quote drafting
  - Summarization

### Edge Function: ai-chat
```typescript
// supabase/functions/ai-chat/index.ts
POST /functions/v1/ai-chat
{
  "messages": [...],      // Conversation history
  "dealershipName": "...", // Personalization
  "leadId": "..."         // Optional interaction logging
}
```

**Features**:
- Personality system prompt
- Compliance-aware responses
- Automatic interaction logging
- Rate limit handling (429, 402)

## Authentication Flow

1. **Sign Up**:
   - Email + password
   - Email verification (optional, can be disabled in Supabase settings)
   - Profile creation trigger (planned)

2. **Sign In**:
   - Email + password
   - Session persistence via localStorage
   - Auto token refresh

3. **Protected Routes**:
   - `ProtectedRoute` wrapper component
   - Checks auth state
   - Redirects to `/auth` if not authenticated

## Compliance Architecture

### Canadian Compliance (CASL, PIPEDA, Law-25)
- **Consent Types**: marketing, sms, phone, email
- **Consent Logging**: IP, user agent, timestamp, channel
- **Opt-out**: One-click unsubscribe (planned)
- **Provincial**: OMVIC (ON), AMVIC (AB), VSA (BC), FCAA (SK), MB

### US Compliance (TCPA, CAN-SPAM, FCRA, GLBA)
- **TCPA**: Prior express consent for calls/texts
- **CAN-SPAM**: Unsubscribe headers (planned)
- **FCRA**: Permissible purpose logging
- **GLBA**: Security safeguards, audit trails

### EU/Global (GDPR)
- **Principles**: Lawfulness, transparency, data minimization
- **DSR Endpoints**: Access, erasure (planned)
- **DPA Templates**: Cross-border data transfer notes

## Tax Calculation

### Canadian Provincial Tax Rates (2025)
- **GST/HST/PST**: Province-specific rates
- **Trade-in Handling**: Pre-tax equity deduction
- **Fees**: Dealer fees, licensing, add-ons
- **Incentives**: Manufacturer and dealer incentives

### Quote Calculator Features
- Real-time calculation as inputs change
- Finance payment calculator (standard loan formula)
- Down payment and trade-in support
- Monthly payment display
- Total interest calculation

## Performance & Mobile

### PWA Features
- **Manifest**: `/manifest.json` with app metadata
- **Service Workers**: Offline support (planned)
- **Install Prompt**: Add to home screen
- **Icons**: Adaptive icons for Android/iOS

### Planned Optimizations
- Code splitting by route
- Image lazy loading
- Virtual scrolling for large lists
- Optimistic UI updates
- Request debouncing

## Security Measures

### Client-Side
- HTTPS only
- XSS protection via React escaping
- CSRF tokens (Supabase handles)
- Input validation (zod schemas)
- Content Security Policy (planned)

### Server-Side
- RLS on all tables
- Prepared statements (Supabase client)
- Rate limiting on edge functions
- API key rotation support
- Audit logging

### Planned: E2EE for Documents
- **Client-side**: WebCrypto AES-GCM
- **Server-side**: Libsodium sealed boxes
- **Key Management**: OTP-based share links
- **Expiry**: Time-based access revocation

## Integration Points (Stubs)

### DMS Integrations (Planned)
- **Dealertrack**: OpenTrack/DealTransfer for desking and credit
- **Autovance**: Desking and inventory sync
- **RouteOne**: Credit application submission
- **vAuto**: Inventory pricing and appraisal

### Marketplace Feeds (Planned)
- **AutoTrader.ca**: Lead import
- **Kijiji Autos**: Lead import
- **CarGurus**: Lead import
- **Facebook Marketplace**: Lead import

### Communication Channels (Planned)
- **Twilio**: SMS/WhatsApp
- **SendGrid**: Email
- **Messenger**: Facebook integration

## Monitoring & Observability (Planned)

### Logging
- Edge function logs (Supabase dashboard)
- Client-side error tracking (Sentry)
- Audit event queries

### Metrics (Planned)
- OpenTelemetry traces
- Performance metrics
- Usage analytics

### Alerting (Planned)
- Error rate thresholds
- Response time alerts
- Compliance audit triggers

## Development Workflow

### Local Development
```bash
npm install
npm run dev
# Navigate to http://localhost:8080
```

### Database Changes
1. Modify schema via Supabase dashboard or migrations
2. Types auto-regenerate on next build
3. Update RLS policies as needed

### Edge Functions
- Auto-deploy on code push
- Test locally with Supabase CLI (planned)
- View logs in Supabase dashboard

### Testing (Planned)
- Unit: Vitest
- E2E: Playwright
- Accessibility: axe-core
- Performance: Lighthouse CI

## Deployment

### Production Checklist
- [ ] Enable email confirmation in Supabase Auth
- [ ] Configure custom domain
- [ ] Set up error monitoring (Sentry)
- [ ] Enable analytics
- [ ] Configure SMTP for emails
- [ ] Set up DMS integrations
- [ ] Import initial vehicle inventory
- [ ] Train team on system
- [ ] Compliance audit
- [ ] Security scan

### Scaling Considerations
- Supabase scales automatically
- Edge functions scale to zero
- Consider read replicas for heavy read workloads
- CDN for static assets
- Connection pooling for database

## Future Roadmap

### Phase 2 (Next 30 days)
- [ ] E2EE document sharing
- [ ] Multi-language support (EN/FR)
- [ ] Advanced lead scoring ML model
- [ ] Email template builder
- [ ] SMS campaigns with CASL compliance
- [ ] Real-time notifications
- [ ] Mobile app (Capacitor)

### Phase 3 (60-90 days)
- [ ] DMS integrations (Dealertrack, Autovance)
- [ ] Marketplace feed imports
- [ ] Advanced analytics dashboard
- [ ] Custom workflow automation
- [ ] White-label support
- [ ] API for third-party integrations
- [ ] Video chat integration

### Phase 4 (120+ days)
- [ ] AI voice assistant
- [ ] Predictive analytics
- [ ] Inventory optimization
- [ ] Dynamic pricing recommendations
- [ ] Customer sentiment analysis
- [ ] Multi-dealership consolidation
- [ ] Enterprise SSO (SAML)
