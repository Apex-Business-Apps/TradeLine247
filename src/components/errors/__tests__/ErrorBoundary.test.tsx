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
      value: { reload: reloadMock },
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
    delete (window as any).location;
    (window as any).location = { href: '' };

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

    window.location = originalLocation;
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

