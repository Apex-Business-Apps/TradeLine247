import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { render } from '@testing-library/react';
import Contact from '../Contact';

vi.mock('@/components/layout/Footer', () => ({ Footer: () => <footer data-testid="footer" /> }));
vi.mock('@/components/seo/SEOHead', () => ({ SEOHead: () => null }));
vi.mock('@/components/seo/LocalBusinessSchema', () => ({ LocalBusinessSchema: () => null }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({ insert: vi.fn().mockResolvedValue({ error: null }) }),
    functions: {
      invoke: vi.fn().mockResolvedValue({ error: null }),
    },
  },
}));
vi.mock('@/components/errors/FormErrorFallback', () => ({ FormErrorFallback: () => null }));

describe('Contact page', () => {
  it('exposes tel: and mailto: anchors for direct contact methods', () => {
    const { container } = render(
      <MemoryRouter>
        <Contact />
      </MemoryRouter>,
    );

    const telLinks = Array.from(container.querySelectorAll('a[href^="tel:"]'));
    const mailLinks = Array.from(container.querySelectorAll('a[href^="mailto:"]'));

    expect(telLinks.length).toBeGreaterThan(0);
    expect(mailLinks.length).toBeGreaterThan(0);
  });
});
