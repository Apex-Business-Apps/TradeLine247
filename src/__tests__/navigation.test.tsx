import React from 'react';
import { describe, it, expect } from 'vitest';
import { Routes, Route } from 'react-router-dom';
import { render, screen } from '@/__tests__/utils/test-utils';
import Features from '@/pages/Features';
import Pricing from '@/pages/Pricing';
import Contact from '@/pages/Contact';
import Security from '@/pages/Security';
import Privacy from '@/pages/Privacy';
import Terms from '@/pages/Terms';
import Documentation from '@/pages/Documentation';
import FAQ from '@/pages/FAQ';

describe('Navigation Pages', () => {
  const pages = [
    { path: '/features', Component: Features, title: 'Features' },
    { path: '/pricing', Component: Pricing, title: 'Pricing' },
    { path: '/documentation', Component: Documentation, title: 'Documentation' },
    { path: '/faq', Component: FAQ, title: 'FAQ' },
    { path: '/contact', Component: Contact, title: 'Contact' },
    { path: '/security', Component: Security, title: 'Security' },
    { path: '/privacy', Component: Privacy, title: 'Privacy' },
    { path: '/terms', Component: Terms, title: 'Terms' },
  ];

  pages.forEach(({ path, Component, title }) => {
    it(`renders ${title} page without router collisions`, () => {
      const { container } = render(
        <Routes>
          <Route path={path} element={<Component />} />
        </Routes>,
        { route: path }
      );

      expect(container).toBeInTheDocument();
      expect(container.textContent?.length ?? 0).toBeGreaterThan(0);
    });
  });
});

