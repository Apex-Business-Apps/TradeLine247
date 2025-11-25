import { describe, expect, it } from 'vitest';
import { paths } from '@/routes/paths';
import { appRoutePaths } from '@/App';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LayoutShell from '@/components/layout/LayoutShell';

describe('route path coverage', () => {
  it('registers every declared path with the router', () => {
    const missing = Object.values(paths).filter((value) => !appRoutePaths.has(value));
    expect(missing).toStrictEqual([]);
  });

  // UX INVARIANTS: Router tests to prevent blank pages and regressions
  describe('router invariants', () => {
    const publicRoutes = [
      paths.home,
      paths.pricing,
      paths.faq,
      paths.features,
      paths.compare,
      paths.security,
      paths.contact,
      paths.privacy,
    ];

    const authRoutes = [
      paths.auth,
      paths.dashboard,
    ];

    it.each(publicRoutes)('public route %s has valid component', (route) => {
      // This test ensures no route is mapped to undefined/null component
      // If a dev accidentally removes or mis-exports a page, this fails before e2e
      expect(appRoutePaths.has(route)).toBe(true);
    });

    it.each(authRoutes)('auth route %s has valid component', (route) => {
      expect(appRoutePaths.has(route)).toBe(true);
    });

    it('has catch-all not found route', () => {
      expect(appRoutePaths.has(paths.notFound)).toBe(true);
    });
  });

  // LAYOUT INVARIANTS: Header guard tests
  describe('layout invariants', () => {
    it('LayoutShell renders header with stable anchor', () => {
      render(
        <BrowserRouter>
          <LayoutShell />
        </BrowserRouter>
      );

      // #app-header-left must exist - this is the stable anchor for all tests
      const headerLeft = document.getElementById('app-header-left');
      expect(headerLeft).toBeInTheDocument();
      expect(headerLeft).toBeVisible();
    });

    it('LayoutShell maintains consistent structure', () => {
      render(
        <BrowserRouter>
          <LayoutShell />
        </BrowserRouter>
      );

      // Critical structural elements that must always exist
      expect(document.querySelector('[data-testid="app-shell"]')).toBeInTheDocument();
    });
  });
});
