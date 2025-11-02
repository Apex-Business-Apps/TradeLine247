import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { render } from '@testing-library/react';
import Index from '../Index';

vi.mock('@/hooks/useAnalytics', () => ({
  useAnalytics: () => ({
    trackPageView: vi.fn(),
  }),
}));

vi.mock('@/components/seo/AISEOHead', () => ({ AISEOHead: () => null }));
vi.mock('@/components/seo/SEOHead', () => ({ SEOHead: () => null }));
vi.mock('@/components/seo/OrganizationSchema', () => ({ OrganizationSchema: () => null }));
vi.mock('@/sections/HeroRoiDuo', () => ({ default: () => <div data-testid="hero-roi-duo" /> }));
vi.mock('@/components/sections/TrustBadgesSlim', () => ({ TrustBadgesSlim: () => <div data-testid="trust-badges" /> }));
vi.mock('@/components/sections/BenefitsGrid', () => ({ BenefitsGrid: () => <div data-testid="benefits-grid" /> }));
vi.mock('@/components/sections/ImpactStrip', () => ({ ImpactStrip: () => <div data-testid="impact-strip" /> }));
vi.mock('@/components/sections/HowItWorks', () => ({ HowItWorks: () => <div data-testid="how-it-works" /> }));
vi.mock('@/components/sections/LeadCaptureForm', () => ({ LeadCaptureForm: () => <form data-testid="lead-capture" /> }));
vi.mock('@/components/sections/NoAIHypeFooter', () => ({ NoAIHypeFooter: () => <div data-testid="no-ai-hype" /> }));
vi.mock('@/components/layout/Footer', () => ({ Footer: () => <footer data-testid="footer" /> }));

describe('Index page', () => {
  it('renders without camelCase fetchPriority attributes on images', () => {
    const { container } = render(
      <MemoryRouter>
        <Index />
      </MemoryRouter>,
    );

    expect(container.querySelectorAll('[fetchPriority]')).toHaveLength(0);
  });
});
