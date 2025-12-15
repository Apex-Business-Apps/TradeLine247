/**
 * SafeErrorBoundary Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import SafeErrorBoundary from '../SafeErrorBoundary';
import { reportReactError } from '@/lib/errorReporter';

// Mock error reporter
vi.mock('@/lib/errorReporter', () => ({
  reportReactError: vi.fn(),
}));

// Mock Button component
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
}));

describe('SafeErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress console.error in tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should render children when no error occurs', () => {
    render(
      <SafeErrorBoundary>
        <div>Test Content</div>
      </SafeErrorBoundary>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should catch and display error when child component throws', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };

    render(
      <SafeErrorBoundary>
        <ThrowError />
      </SafeErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText(/We encountered an unexpected error/)).toBeInTheDocument();
  });

  it('should call reportReactError when error is caught', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };

    render(
      <SafeErrorBoundary>
        <ThrowError />
      </SafeErrorBoundary>
    );

    expect(reportReactError).toHaveBeenCalled();
  });

  it('should display error details in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const ThrowError = () => {
      throw new Error('Test error message');
    };

    render(
      <SafeErrorBoundary>
        <ThrowError />
      </SafeErrorBoundary>
    );

    // Error details should be available in details element
    const details = screen.getByText('Error details');
    expect(details).toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it('should have reload button that reloads page', () => {
    const reloadMock = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: reloadMock },
      writable: true,
    });

    const ThrowError = () => {
      throw new Error('Test error');
    };

    render(
      <SafeErrorBoundary>
        <ThrowError />
      </SafeErrorBoundary>
    );

    const reloadButton = screen.getByText('Reload Page');
    reloadButton.click();

    expect(reloadMock).toHaveBeenCalled();
  });

  it('should handle errors with stack traces', () => {
    const error = new Error('Error with stack');
    error.stack = 'Error: Error with stack\n  at test.js:1:1';

    const ThrowError = () => {
      throw error;
    };

    render(
      <SafeErrorBoundary>
        <ThrowError />
      </SafeErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(reportReactError).toHaveBeenCalledWith(error, expect.any(Object));
  });

  it('should handle multiple errors sequentially', () => {
    const Error1 = () => {
      throw new Error('Error 1');
    };

    const { rerender } = render(
      <SafeErrorBoundary>
        <Error1 />
      </SafeErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // Error boundary state persists, so we need to create new instance
    const Error2 = () => {
      throw new Error('Error 2');
    };

    rerender(
      <SafeErrorBoundary>
        <Error2 />
      </SafeErrorBoundary>
    );

    // Should still show error UI
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });
});

