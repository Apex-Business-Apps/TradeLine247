import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Header } from '../Header';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      email: 'jr@example.com',
      user_metadata: { display_name: 'JR Test', avatar_url: 'avatar.png' },
    },
    userRole: 'user',
    signOut: vi.fn(),
    isAdmin: () => false,
  }),
}));

vi.mock('@/hooks/useSafeNavigation', () => ({
  useSafeNavigation: () => ({ goToWithFeedback: vi.fn() }),
}));

vi.mock('@/components/LanguageSwitcher', () => ({
  LanguageSwitcher: () => <button aria-label="language switcher" />,
}));

vi.mock('@/assets/badges/built-canadian.svg', () => ({ default: 'badge.svg' }));

vi.mock('@/stores/userPreferencesStore', () => ({
  useUserPreferencesStore: () => ({
    preferredName: 'JR',
    showWelcomeMessage: true,
  }),
}));

describe('Header user menu', () => {
  let hourSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    hourSpy = vi.spyOn(Date.prototype, 'getHours').mockReturnValue(9);
  });

  afterEach(() => {
    hourSpy.mockRestore();
  });

  it('moves the greeting into the avatar menu and closes on Escape', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    const trigger = screen.getByLabelText(/open user menu/i);
    await user.click(trigger);

    expect(await screen.findByText(/good morning, jr/i)).toBeInTheDocument();
    expect(screen.getByText('jr@example.com')).toBeInTheDocument();

    await user.keyboard('{Escape}');

    expect(screen.queryByText(/good morning, jr/i)).not.toBeInTheDocument();
  });
});
