# AutoRepAi - Advanced Dealership AI Platform

🚀 **Production-ready, compliance-first dealership management platform** with AI-powered lead qualification, Canadian tax calculations, and enterprise-grade security.

## ✨ Features

### Core Functionality
- ✅ **AI Concierge**: Humanized chatbot powered by Google Gemini 2.5 Flash
- ✅ **Lead Management**: Capture, score, qualify, and track with full consent logging
- ✅ **Inventory Management**: Vehicle database with multi-source sync ready
- ✅ **Smart Quoting**: Canadian provincial tax calculator (GST/HST/PST)
- ✅ **Credit Applications**: FCRA-compliant with consent tracking
- ✅ **Omnichannel Inbox**: Unified communications (planned expansion)
- ✅ **Compliance-First**: CASL, PIPEDA, TCPA, GDPR built-in

### Technical Highlights
- 🔐 Row Level Security (RLS) on all tables
- 📊 Comprehensive audit logging
- 🎯 Role-based access control (RBAC)
- 📱 Progressive Web App (PWA) ready
- 🌍 Multi-tenant with jurisdiction awareness
- ⚡ Real-time updates via Supabase

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Supabase account (already connected)

### Installation
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Navigate to `http://localhost:8080`

### First-Time Setup
1. **Create Account**: Visit `/auth` and sign up
2. **Configure Settings**: Go to `/settings` to set jurisdiction and compliance preferences
3. **Add Vehicle**: Navigate to `/inventory` and add your first vehicle
4. **Test AI Chat**: Click the chat widget to interact with AutoRepAi assistant

## 📚 Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System design and technical details
- [COMPLIANCE.md](./COMPLIANCE.md) - Regulatory compliance guide
- [SECURITY.md](./SECURITY.md) - Security controls and best practices

## 🎯 Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **AI**: Lovable AI Gateway (Google Gemini 2.5 Flash)
- **Auth**: Supabase Auth with RLS
- **UI**: Radix UI + Custom Design System

## 🔑 Key Pages

- `/` - Landing page
- `/auth` - Sign in/up
- `/dashboard` - Main dashboard with stats
- `/leads` - Lead management
- `/inventory` - Vehicle inventory
- `/quotes` - Quote list
- `/quotes/new` - Interactive quote calculator
- `/credit-apps` - Credit applications
- `/inbox` - Communication hub
- `/settings` - System configuration

## 🛡️ Compliance Features

### Canadian
- ✅ CASL consent tracking (marketing, SMS, email)
- ✅ PIPEDA principles implementation
- ✅ Quebec Law-25 considerations
- ✅ Provincial dealer regulations (OMVIC, AMVIC, VSA)

### United States
- ✅ TCPA consent logging
- ✅ FCRA credit application compliance
- ✅ GLBA security safeguards
- ⏳ CAN-SPAM email compliance (planned)

### EU/Global
- ✅ GDPR principles
- ⏳ Data subject access requests (planned)

## 🔐 Security

- **Authentication**: Supabase Auth with session management
- **Authorization**: Row Level Security + role-based access
- **Audit Logging**: All critical actions logged
- **Data Protection**: Encryption in transit (HTTPS)
- **Compliance**: Full audit trails for regulatory requirements

## 🌐 AI Integration

AutoRepAi uses **Lovable AI Gateway** with Google Gemini:
- **Automatic setup**: No API keys needed
- **Free tier**: Gemini models free until Oct 6, 2025
- **Rate limiting**: Built-in error handling
- **Compliance-aware**: Respects consent preferences

### AI Edge Function
```typescript
// Already deployed at: /functions/v1/ai-chat
POST https://niorocndzcflrwdrofsp.supabase.co/functions/v1/ai-chat
{
  "messages": [...],
  "dealershipName": "Your Dealer",
  "leadId": "optional-uuid"
}
```

## 📊 Database Schema

See [ARCHITECTURE.md](./ARCHITECTURE.md) for complete schema details.

**Key Tables:**
- `organizations` - Multi-tenant org structure
- `dealerships` - Dealership locations
- `profiles` - User profiles (extends auth.users)
- `user_roles` - Security-first RBAC
- `leads` - Lead capture and tracking
- `vehicles` - Inventory management
- `quotes` - Quote versioning
- `credit_applications` - Credit apps with consent
- `consents` - Explicit consent tracking
- `audit_events` - Compliance audit log

## 🎨 Design System

Apple-inspired minimalist design with:
- Semantic color tokens (HSL-based)
- Consistent spacing and typography
- Dark mode support
- Accessible by default (WCAG 2.2 AA)
- Responsive mobile-first layouts

## 🚧 Roadmap

### Immediate (Week 1-2)
- [ ] Email integration (Resend)
- [ ] SMS integration (Twilio)
- [ ] E2EE document sharing
- [ ] Enhanced lead scoring

### Short-term (Month 1)
- [ ] Multi-language (EN/FR)
- [ ] Dealertrack connector
- [ ] Autovance connector
- [ ] Advanced analytics

### Long-term (Quarter 1)
- [ ] Mobile app (Capacitor)
- [ ] Marketplace integrations
- [ ] Voice assistant
- [ ] Predictive analytics

## 📝 License

Proprietary - All rights reserved

## 🤝 Support

For issues or questions:
- Check documentation in `/docs`
- Review [COMPLIANCE.md](./COMPLIANCE.md) for regulatory questions
- Contact your Lovable account manager

## 🎓 Training

Essential training for your team:
1. **Sales**: CASL/TCPA compliance, lead capture
2. **Finance**: FCRA requirements, credit applications
3. **Management**: Audit processes, compliance oversight

## ⚡ Performance

- Lighthouse Score: 90+ (target)
- LCP: <2.5s
- TTI: <3.0s
- PWA installable

## 🔗 Quick Links

- [Supabase Dashboard](https://supabase.com/dashboard/project/niorocndzcflrwdrofsp)
- [Edge Functions](https://supabase.com/dashboard/project/niorocndzcflrwdrofsp/functions)
- [Database Tables](https://supabase.com/dashboard/project/niorocndzcflrwdrofsp/editor)

---

Built with ❤️ using Lovable • Ready for production deployment
