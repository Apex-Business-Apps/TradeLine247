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

    const badges = screen.getAllByTestId('trust-badge');
    expect(badges.length).toBeGreaterThanOrEqual(4);
    expect(screen.getByText(/Backed by Alberta Innovates/i)).toBeInTheDocument();
  });
});
