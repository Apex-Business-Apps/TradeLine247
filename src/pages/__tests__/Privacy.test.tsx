import { render, screen } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';

import Privacy from '../Privacy';

describe('Privacy page call recording section', () => {
  it('renders call recording disclosure with anchor', () => {
    render(
      <HelmetProvider>
        <Privacy />
      </HelmetProvider>
    );

    const anchor = screen.getByRole('link', { name: /call recording policy/i });
    expect(anchor).toHaveAttribute('href', '#call-recording');

    const section = document.getElementById('call-recording');
    expect(section).not.toBeNull();
    expect(section?.textContent).toMatch(/Retention/i);
    expect(section?.textContent).toMatch(/Opt-Out/i);
  });
});

