/**
 * AppErrorBoundary Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppErrorBoundary } from '../ErrorBoundary';
import { reportReactError } from '@/lib/errorReporter';

// Mock dependencies
vi.mock('@/lib/errorReporter', () => ({
  reportReactError: vi.fn(),
}));

vi.mock('react-helmet-async', () => ({
  Helmet: ({ children }: any) => <>{children}</>,
  HelmetProvider: ({ children }: any) => <>{children}</>,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
}));

vi.mock('@/components/ui/card', () => ({
  Card: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h2>{children}</h2>,
  CardDescription: ({ children }: any) => <p>{children}</p>,
  CardContent: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('lucide-react', () => ({
  AlertTriangle: () => <span data-testid="alert-icon">⚠️</span>,
  Home: () => <span data-testid="home-icon">🏠</span>,
  RefreshCw: () => <span data-testid="refresh-icon">🔄</span>,
}));

describe('AppErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should render children when no error occurs', () => {
    render(
      <AppErrorBoundary>
        <div>Test Content</div>
      </AppErrorBoundary>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should catch and display error UI', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };

    render(
      <AppErrorBoundary>
        <ThrowError />
      </AppErrorBoundary>
    );

    expect(screen.getByText('Something Went Wrong')).toBeInTheDocument();
    expect(screen.getByText(/We encountered an unexpected error/)).toBeInTheDocument();
  });

  it('should call reportReactError when error is caught', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };

    render(
      <AppErrorBoundary>
        <ThrowError />
      </AppErrorBoundary>
    );

    expect(reportReactError).toHaveBeenCalled();
  });

  it('should call trackError if window.trackError exists', () => {
    const trackErrorMock = vi.fn();
    (window as any).trackError = trackErrorMock;

    const ThrowError = () => {
      throw new Error('Test error');
    };

    render(
      <AppErrorBoundary>
        <ThrowError />
      </AppErrorBoundary>
    );

    expect(trackErrorMock).toHaveBeenCalledWith(
      'app_error_boundary',
      'Test error',
      expect.objectContaining({
        componentStack: expect.any(String),
        stack: expect.any(String),
      })
    );

    delete (window as any).trackError;
  });

  it('should show error message in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const ThrowError = () => {
      throw new Error('Test error message');
    };

    render(
      <AppErrorBoundary>
        <ThrowError />
      </AppErrorBoundary>
    );

    expect(screen.getByText('Test error message')).toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it('should not show error message in production mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const ThrowError = () => {
      throw new Error('Test error message');
    };

    render(
      <AppErrorBoundary>
        <ThrowError />
      </AppErrorBoundary>
    );

    expect(screen.queryByText('Test error message')).not.toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it('should reload page on retry button click', () => {
    const reloadMock = vi.fn();
    Object.defineProperty(window, 'location', {
      value: {
        reload: reloadMock,
        href: window.location.href,
        origin: window.location.origin,
        protocol: window.location.protocol,
        host: window.location.host,
        hostname: window.location.hostname,
        port: window.location.port,
        pathname: window.location.pathname,
        search: window.location.search,
        hash: window.location.hash,
      },
      writable: true,
    });

    const ThrowError = () => {
      throw new Error('Test error');
    };

    render(
      <AppErrorBoundary>
        <ThrowError />
      </AppErrorBoundary>
    );

    const retryButton = screen.getByText('Retry');
    retryButton.click();

    expect(reloadMock).toHaveBeenCalled();
  });

  it('should navigate home on Go Home button click', () => {
    const originalLocation = window.location;
    const mockLocation = {
      href: '',
      origin: 'http://localhost:3000',
      protocol: 'http:',
      host: 'localhost:3000',
      hostname: 'localhost',
      port: '3000',
      pathname: '/',
      search: '',
      hash: '',
      reload: vi.fn(),
      assign: vi.fn(),
      replace: vi.fn(),
      toString: () => 'http://localhost:3000/',
      ancestorOrigins: {} as DOMStringList,
    };

    // Use Object.defineProperty for proper Location mocking
    Object.defineProperty(window, 'location', {
      value: mockLocation,
      writable: true,
      configurable: true,
    });

    const ThrowError = () => {
      throw new Error('Test error');
    };

    render(
      <AppErrorBoundary>
        <ThrowError />
      </AppErrorBoundary>
    );

    const homeButton = screen.getByText('Go Home');
    homeButton.click();

    // Note: This test verifies the click handler is called
    // Actual navigation behavior may vary in test environment
    expect(homeButton).toBeInTheDocument();
    expect(window.location.href).toBe('/');

    // Restore original location with proper typing
    Object.defineProperty(window, 'location', {
      value: originalLocation as Location,
      writable: true,
      configurable: true,
    });
  });

  it('should display support email link', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };

    render(
      <AppErrorBoundary>
        <ThrowError />
      </AppErrorBoundary>
    );

    const supportLink = screen.getByText(/info@tradeline247ai.com/);
    expect(supportLink).toBeInTheDocument();
    expect(supportLink).toHaveAttribute('href', 'mailto:info@tradeline247ai.com');
  });

  it('should handle errors with errorInfo', () => {
    const error = new Error('Test error');
    error.stack = 'Error stack trace';

    const ThrowError = () => {
      throw error;
    };

    render(
      <AppErrorBoundary>
        <ThrowError />
      </AppErrorBoundary>
    );

    expect(reportReactError).toHaveBeenCalledWith(
      error,
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );
  });

  it('should display icons correctly', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };

    render(
      <AppErrorBoundary>
        <ThrowError />
      </AppErrorBoundary>
    );

    expect(screen.getByTestId('alert-icon')).toBeInTheDocument();
    expect(screen.getByTestId('refresh-icon')).toBeInTheDocument();
    expect(screen.getByTestId('home-icon')).toBeInTheDocument();
  });
});

