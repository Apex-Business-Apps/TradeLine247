# TradeLine 24/7 - AI Receptionist Platform

**Your 24/7 AI Receptionist - Never miss a call. Work while you sleep.**

TradeLine 24/7 is a comprehensive telephony SaaS platform that provides AI-powered receptionist services for businesses. The system answers calls 24/7, qualifies leads, and sends clean email transcripts to help businesses never miss an opportunity.

## 🚀 Live Demo

- **Production**: [tradeline247.vercel.app](https://tradeline247.vercel.app)
- **Repository**: [GitHub](https://github.com/Apex-Business-Apps/TradeLine247)

## 🛠️ Tech Stack

- **Frontend**: React 18.3.1 + TypeScript 5.8.3 + Vite 5.4.19
- **UI Framework**: shadcn/ui (Radix UI primitives) + Tailwind CSS 3.4.17
- **State Management**: Zustand 4.5.7 + TanStack React Query 5.90.11
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions)
- **Telephony**: Twilio API integration
- **AI**: OpenAI API integration
- **Mobile**: Capacitor 7.4.4 (iOS/Android support)
- **Deployment**: Vercel + GitHub Actions CI/CD

## 📋 Prerequisites

- **Node.js**: 20.x (LTS)
- **npm**: ≥10.0.0
- **Git**: Latest version

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/Apex-Business-Apps/TradeLine247.git
   cd TradeLine247
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy and configure your environment variables
   cp .env.example .env.local
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Run tests**
   ```bash
   npm run test:ci  # Full test suite
   npm run test:e2e:smoke  # Smoke tests only
   ```

## Windows: Fix EPERM unlink during npm install

- Close VS Code + stop node processes
- (Optional) Add Defender exclusion for the repo folder
- Delete node_modules using: `cmd /c "rd /s /q node_modules"`
- Run: `npm ci`
- Run: `npm run build`

`npm ci` is the recommended clean install for CI parity.

## 📁 Project Structure

```
TradeLine247/
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── ui/           # shadcn/ui components
│   │   ├── layout/       # Layout components
│   │   ├── dashboard/    # Dashboard-specific components
│   │   └── sections/     # Landing page sections
│   ├── pages/            # Route components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility functions
│   ├── stores/           # Zustand state stores
│   └── types/            # TypeScript type definitions
├── supabase/
│   ├── functions/        # Edge functions
│   └── migrations/       # Database migrations
├── tests/                # Test files
├── ios/                  # iOS Capacitor project
├── android/              # Android Capacitor project
└── scripts/              # Build and utility scripts
```

## 🎯 Key Features

### 🤖 AI Receptionist
- 24/7 automated call answering
- Intelligent lead qualification
- Clean email transcript delivery
- Customizable AI responses

### 📊 Dashboard & Analytics
- Real-time call monitoring
- Performance metrics and KPIs
- ROI calculator and reporting
- Service health monitoring

### 🔐 Security & Compliance
- Enterprise-grade security
- GDPR compliance ready
- WCAG AA accessibility
- CSP and security headers

### 📱 Multi-Platform Support
- Responsive web application
- iOS native app (Capacitor)
- Android native app (Capacitor)
- PWA capabilities

## 🧪 Testing

### Unit Tests
```bash
npm run test:unit
```

### E2E Tests
```bash
npm run test:e2e          # Full E2E suite
npm run test:e2e:smoke    # Critical path tests
npm run test:a11y         # Accessibility tests
npm run test:security     # Security validation
```

### CI/CD Tests
```bash
npm run test:ci           # Full CI pipeline
npm run test:ci:coverage  # With coverage reporting
```

## 🚢 Deployment

### Web Deployment (Vercel)
```bash
npm run build:web
# Deploy via Vercel dashboard or GitHub integration
```

### Mobile Builds
```bash
# iOS
npm run build:ios

# Android
npm run build:android
```

### CI/CD
- **GitHub Actions**: Automated testing and deployment
- **Codemagic**: iOS/Android mobile builds
- **Vercel**: Web deployment with preview environments

## 🔧 Development Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | TypeScript type checking |
| `npm run test:unit` | Unit tests |
| `npm run test:e2e` | E2E tests |
| `npm run test:ci` | Full CI test suite |

## 📚 Documentation

- [Security Policy](SECURITY.md)
- [API Documentation](docs/)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Contributing Guidelines](CONTRIBUTING.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software owned by Apex Business Systems.

## 📞 Support

For support or questions:
- **Email**: info@tradeline247ai.com
- **Phone**: 587-742-8885
- **Documentation**: [docs/](docs/)

---

**Built with ❤️ by Apex Business Systems**