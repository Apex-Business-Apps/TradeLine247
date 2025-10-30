import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Pricing from '../Pricing';
import Auth from '../Auth';
import Index from '../Index';

// Mock all the heavy components to keep tests fast
vi.mock('@/hooks/useAnalytics', () => ({
  useAnalytics: () => ({
    trackPageView: vi.fn(),
  }),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    userRole: null,
    signOut: vi.fn(),
    isAdmin: () => false,
  }),
}));

vi.mock('@/hooks/usePasswordSecurity', () => ({
  usePasswordSecurity: () => ({
    validatePassword: vi.fn().mockResolvedValue({
      isValid: true,
      strength: 'Strong',
      isBreached: false,
    }),
  }),
}));

vi.mock('@/components/seo/SEOHead', () => ({ SEOHead: () => null }));
vi.mock('@/components/seo/OrganizationSchema', () => ({ OrganizationSchema: () => null }));
vi.mock('@/sections/HeroRoiDuo', () => ({ default: () => <div data-testid="hero-roi-duo">Hero Section</div> }));
vi.mock('@/components/sections/TrustBadgesSlim', () => ({ TrustBadgesSlim: () => <div data-testid="trust-badges" /> }));
vi.mock('@/components/sections/BenefitsGrid', () => ({ BenefitsGrid: () => <div data-testid="benefits-grid" /> }));
vi.mock('@/components/sections/ImpactStrip', () => ({ ImpactStrip: () => <div data-testid="impact-strip" /> }));
vi.mock('@/components/sections/HowItWorks', () => ({ HowItWorks: () => <div data-testid="how-it-works" /> }));
vi.mock('@/components/sections/LeadCaptureForm', () => ({ LeadCaptureForm: () => <form data-testid="lead-capture" /> }));
vi.mock('@/components/sections/NoAIHypeFooter', () => ({ NoAIHypeFooter: () => <div data-testid="no-ai-hype" /> }));
vi.mock('@/components/layout/Footer', () => ({ Footer: () => <footer data-testid="footer" /> }));
vi.mock('@/components/LanguageSwitcher', () => ({ LanguageSwitcher: () => <div data-testid="language-switcher" /> }));
vi.mock('@/components/ui/logo', () => ({ Logo: () => <div data-testid="logo" /> }));

// Mock integrations
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
    },
  },
  isSupabaseEnabled: false,
}));

// Mock react-router for Auth component
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

describe('Router Smoke Tests', () => {
  it('should render Pricing page with visible CTA', () => {
    const { container } = render(<Pricing />);

    // Check that pricing page renders
    expect(container.textContent).toMatch(/pricing/i);

    // Check for CTA text (Start free trial)
    expect(container.textContent).toMatch(/start free trial/i);
  });

  it('should render Auth page with sign in form', () => {
    const { container } = render(<Auth />);

    // Check that auth page renders
    expect(container.textContent).toMatch(/welcome to tradeline 24\/7/i);

    // Check for sign in button
    expect(container.textContent).toMatch(/sign in/i);
  });

  it('should render Index page with hero section', () => {
    render(<Index />);

    // Check that hero section renders
    expect(screen.getByTestId('hero-roi-duo')).toBeInTheDocument();
  });

  it('should render Pricing with correct structure', () => {
    const { container } = render(<Pricing />);

    // Verify pricing page has proper structure
    const section = container.querySelector('section');
    expect(section).toBeTruthy();
    expect(section?.className).toContain('container');
  });
});
