import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Footer } from '../Footer';

vi.mock('@/hooks/usePWA', () => ({
  usePWA: () => ({ isInstallable: false, isInstalled: false, showInstallPrompt: vi.fn() }),
}));

describe('Footer', () => {
  it('renders brand, nav links, and trust badges', () => {
    render(<Footer />);

    expect(screen.getAllByText(/TradeLine 24\/7/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Apex Business Systems/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /info@tradeline247ai.com/i })).toBeInTheDocument();

    ['Security', 'Compare', 'Privacy', 'Terms', 'Contact'].forEach((label) => {
      expect(screen.getByRole('link', { name: label })).toBeInTheDocument();
    });

    const partnerBadges = screen.getAllByAltText(
      /(Apex Business Systems|Alberta Innovates|ERIN - Edmonton Regional Innovation Network)/i
    );
    expect(partnerBadges.length).toBeGreaterThanOrEqual(3);
    expect(screen.getByAltText(/Alberta Innovates/i)).toBeInTheDocument();
  });
});
