import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { createInstance, type Resource } from 'i18next';
import { act } from 'react';
import { LanguageToggle } from '@/components/common/LanguageToggle';
import { PWAInstallPrompt } from '@/components/common/PWAInstallPrompt';
import { QuickActionsCard } from '@/components/dashboard/QuickActionsCard';

const resources: Resource = {
  en: {
    common: {
      language: {
        switch: 'Language',
        en: 'English',
        'fr-CA': 'Français (CA)',
      },
      quickActions: {
        title: 'Quick Actions',
        heading: 'Quick actions for operators',
        subheading:
          'Jump straight into the workflows you use every day. These shortcuts survive refreshes and deep links.',
        actions: {
          viewCalls: { label: 'View Calls', description: 'Review call history and activity' },
          addNumber: { label: 'Add Number', description: 'Purchase or provision a new phone number' },
          inviteStaff: { label: 'Invite Staff', description: 'Grant access to team members' },
          integrations: { label: 'Integrations', description: 'Connect external services' },
        },
      },
    },
  },
  'fr-CA': {
    common: {
      language: {
        switch: 'Langue',
        en: 'English',
        'fr-CA': 'Français (CA)',
      },
      quickActions: {
        title: 'Actions rapides',
        heading: 'Actions rapides pour les opérateurs',
        subheading:
          'Accédez directement aux flux que vous utilisez chaque jour. Ces raccourcis survivent aux rafraîchissements et aux liens profonds.',
        actions: {
          viewCalls: { label: 'Voir les appels', description: "Consulter l'historique et l'activité des appels" },
          addNumber: { label: 'Ajouter un numéro', description: 'Acheter ou provisionner un nouveau numéro de téléphone' },
          inviteStaff: { label: 'Inviter le personnel', description: "Donner accès aux membres de l'équipe" },
          integrations: { label: 'Intégrations', description: 'Connecter des services externes' },
        },
      },
    },
  },
};

const createTestI18n = async (lng = 'en') => {
  const i18n = createInstance();
  i18n.use(LanguageDetector).use(initReactI18next);
  await i18n.init({
    resources,
    lng,
    fallbackLng: 'en',
    ns: ['common'],
    defaultNS: 'common',
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'tl24-lang',
    },
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });
  return i18n;
};

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockReturnValue({
      matches: false,
      media: '',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  });
});

describe('LanguageToggle', () => {
  it('renders and switches language', async () => {
    const i18n = await createTestI18n('en');
    const user = userEvent.setup();

    render(
      <I18nextProvider i18n={i18n}>
        <LanguageToggle />
      </I18nextProvider>
    );

    await user.click(screen.getByLabelText('Language'));
    await user.click(await screen.findByText('Français (CA)'));

    await waitFor(() => expect(i18n.language).toBe('fr-CA'));
    expect(localStorage.getItem('tl24-lang')).toBe('fr-CA');
  });
});

describe('PWAInstallPrompt', () => {
  it('respects 7-day dismissal', () => {
    const sixDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString();
    localStorage.setItem('tl24-pwa-dismissed', sixDaysAgo);

    render(<PWAInstallPrompt />);

    expect(screen.queryByTestId('pwa-install')).toBeNull();
    expect(screen.queryByTestId('pwa-install-ios')).toBeNull();
  });

  it('shows again after 7 days', async () => {
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
    localStorage.setItem('tl24-pwa-dismissed', eightDaysAgo);

    render(<PWAInstallPrompt />);

    const event = new Event('beforeinstallprompt') as Event & {
      prompt: () => Promise<void>;
      userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
    };
    event.prompt = vi.fn().mockResolvedValue();
    event.userChoice = Promise.resolve({ outcome: 'dismissed' });

    await act(async () => {
      window.dispatchEvent(event);
    });

    await waitFor(() => expect(screen.getByTestId('pwa-install')).toBeInTheDocument());
  });
});

describe('Overlay z-index', () => {
  it('card renders above scrim layer', async () => {
    const i18n = await createTestI18n('en');
    const { container } = render(
      <MemoryRouter>
        <I18nextProvider i18n={i18n}>
          <>
            <div className="hero-scrim" style={{ zIndex: 1 }} />
            <QuickActionsCard />
          </>
        </I18nextProvider>
      </MemoryRouter>
    );

    const scrim = container.querySelector('.hero-scrim') as HTMLDivElement;
    const card = container.querySelector('.quick-actions-card') as HTMLDivElement;

    expect(scrim?.style.zIndex).toBe('1');
    expect(card?.style.zIndex).toBe('2');
  });
});
