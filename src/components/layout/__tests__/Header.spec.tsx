import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { Header } from '../Header';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    userRole: null,
    signOut: vi.fn(),
    isAdmin: () => false,
  }),
}));

vi.mock('@/components/LanguageSwitcher', () => ({
  LanguageSwitcher: () => <div data-testid="language-switcher" />,
}));

vi.mock('@/components/ui/navigation-menu', () => ({
  NavigationMenu: ({ children }: { children: ReactNode }) => <nav>{children}</nav>,
  NavigationMenuList: ({ children }: { children: ReactNode }) => <ul>{children}</ul>,
  NavigationMenuItem: ({ children }: { children: ReactNode }) => <li>{children}</li>,
  NavigationMenuLink: ({ children }: { children: ReactNode }) => <span>{children}</span>,
  NavigationMenuTrigger: ({ children }: { children: ReactNode }) => <button type="button">{children}</button>,
  NavigationMenuContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

describe('Header', () => {
  it('exposes a mobile burger menu with accessibility hooks', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    const burgerButton = screen.getByRole('button', { name: /toggle mobile menu/i });
    expect(burgerButton).toBeVisible();
    expect(burgerButton).toHaveAttribute('aria-controls', 'mobile-menu');
    expect(burgerButton).toHaveAttribute('aria-expanded', 'false');

    // Mobile menu should not be in DOM when closed
    let mobileMenu = document.getElementById('mobile-menu');
    expect(mobileMenu).toBeNull();

    await user.click(burgerButton);

    expect(burgerButton).toHaveAttribute('aria-expanded', 'true');
    // Mobile menu should now be in DOM when open
    mobileMenu = document.getElementById('mobile-menu');
    expect(mobileMenu).not.toBeNull();
    expect(mobileMenu).toHaveAttribute('aria-label', 'Mobile');
  });
});
