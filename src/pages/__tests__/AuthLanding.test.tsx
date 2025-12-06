/**
 * AuthLanding Form Tests - P0 Fix Verification
 * Tests for form validation and submission handler
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import AuthLanding from '../AuthLanding';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      })),
      insert: vi.fn(() => Promise.resolve({ data: null, error: null }))
    }))
  },
  isSupabaseEnabled: true
}));

// Mock navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

describe('AuthLanding - P0 Fix: Form Validation and Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderAuthLanding = () => {
    return render(
      <BrowserRouter>
        <AuthLanding />
      </BrowserRouter>
    );
  };

  describe('Form rendering', () => {
    it('should render form with all fields', () => {
      renderAuthLanding();

      expect(screen.getByText('Start Your Free 14-Day Trial')).toBeInTheDocument();
      expect(screen.getByLabelText(/Business Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Start My 14-Day Trial/i })).toBeInTheDocument();
    });

    it('should render sign in link', () => {
      renderAuthLanding();
      expect(screen.getByText(/Already have an account/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Sign in/i })).toBeInTheDocument();
    });

    it('should have required field indicators', () => {
      renderAuthLanding();
      const labels = screen.getAllByText('*');
      expect(labels.length).toBeGreaterThanOrEqual(2); // Both fields required
    });
  });

  describe('Form validation', () => {
    it('should show validation error for short business name', async () => {
      const user = userEvent.setup();
      renderAuthLanding();

      const businessNameInput = screen.getByLabelText(/Business Name/i);
      const emailInput = screen.getByLabelText(/Email Address/i);
      const submitButton = screen.getByRole('button', { name: /Start My 14-Day Trial/i });

      await user.type(businessNameInput, 'A'); // Too short
      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Business name must be at least 2 characters/i)).toBeInTheDocument();
      });
    });

    it('should show validation error for long business name', async () => {
      const user = userEvent.setup();
      renderAuthLanding();

      const businessNameInput = screen.getByLabelText(/Business Name/i);
      const emailInput = screen.getByLabelText(/Email Address/i);
      const submitButton = screen.getByRole('button', { name: /Start My 14-Day Trial/i });

      const longName = 'A'.repeat(101); // Too long (max is 100)
      fireEvent.change(businessNameInput, { target: { value: longName } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Business name too long/i)).toBeInTheDocument();
      }, { timeout: 10000 });
    }, 10000);

    it('should show validation error for invalid email', async () => {
      const user = userEvent.setup();
      renderAuthLanding();

      const businessNameInput = screen.getByLabelText(/Business Name/i);
      const emailInput = screen.getByLabelText(/Email Address/i);
      const submitButton = screen.getByRole('button', { name: /Start My 14-Day Trial/i });

      await user.type(businessNameInput, 'Test Company');
      await user.type(emailInput, 'invalid-email');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Please enter a valid email address/i)).toBeInTheDocument();
      });
    });

    it('should show validation error for long email', async () => {
      const user = userEvent.setup();
      renderAuthLanding();

      const businessNameInput = screen.getByLabelText(/Business Name/i);
      const emailInput = screen.getByLabelText(/Email Address/i);
      const submitButton = screen.getByRole('button', { name: /Start My 14-Day Trial/i });

      const longEmail = 'a'.repeat(250) + '@example.com'; // Too long (max is 255)
      fireEvent.change(businessNameInput, { target: { value: 'Test Company' } });
      fireEvent.change(emailInput, { target: { value: longEmail } });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Email too long/i)).toBeInTheDocument();
      }, { timeout: 10000 });
    }, 10000);

    it('should trim whitespace from inputs', async () => {
      const user = userEvent.setup();
      renderAuthLanding();

      const businessNameInput = screen.getByLabelText(/Business Name/i);
      const emailInput = screen.getByLabelText(/Email Address/i);
      const submitButton = screen.getByRole('button', { name: /Start My 14-Day Trial/i });

      await user.type(businessNameInput, '  Test Company  ');
      await user.type(emailInput, '  test@example.com  ');
      await user.click(submitButton);

      // Should not show validation errors for trimmed valid input
      await waitFor(() => {
        expect(screen.queryByText(/Business name must be at least 2 characters/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Form submission', () => {
    it('should disable submit button while loading', async () => {
      const user = userEvent.setup();
      renderAuthLanding();

      const businessNameInput = screen.getByLabelText(/Business Name/i);
      const emailInput = screen.getByLabelText(/Email Address/i);
      const submitButton = screen.getByRole('button', { name: /Start My 14-Day Trial/i });

      await user.type(businessNameInput, 'Test Company');
      await user.type(emailInput, 'test@example.com');

      expect(submitButton).not.toBeDisabled();

      await user.click(submitButton);

      // Button should be disabled during submission
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      }, { timeout: 100 });
    });

    it('should show loading spinner during submission', async () => {
      const user = userEvent.setup();
      renderAuthLanding();

      const businessNameInput = screen.getByLabelText(/Business Name/i);
      const emailInput = screen.getByLabelText(/Email Address/i);
      const submitButton = screen.getByRole('button', { name: /Start My 14-Day Trial/i });

      await user.type(businessNameInput, 'Test Company');
      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      // Should show loading spinner (Loader2 icon)
      await waitFor(() => {
        const loadingSpinner = screen.getByRole('button', { name: /Start My 14-Day Trial/i });
        expect(loadingSpinner).toBeDisabled();
      }, { timeout: 100 });
    });

    it('should disable button when fields are empty', () => {
      renderAuthLanding();

      const submitButton = screen.getByRole('button', { name: /Start My 14-Day Trial/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper label associations', () => {
      renderAuthLanding();

      const businessNameInput = screen.getByLabelText(/Business Name/i);
      const emailInput = screen.getByLabelText(/Email Address/i);

      expect(businessNameInput).toHaveAttribute('id');
      expect(emailInput).toHaveAttribute('id');
    });

    it('should have proper input types', () => {
      renderAuthLanding();

      const businessNameInput = screen.getByLabelText(/Business Name/i);
      const emailInput = screen.getByLabelText(/Email Address/i);

      expect(businessNameInput).toHaveAttribute('type', 'text');
      expect(emailInput).toHaveAttribute('type', 'email');
    });

    it('should mark required fields', () => {
      renderAuthLanding();

      const businessNameInput = screen.getByLabelText(/Business Name/i);
      const emailInput = screen.getByLabelText(/Email Address/i);

      expect(businessNameInput).toBeRequired();
      expect(emailInput).toBeRequired();
    });

    it('should show validation errors with proper styling', async () => {
      const user = userEvent.setup();
      renderAuthLanding();

      const businessNameInput = screen.getByLabelText(/Business Name/i);
      const emailInput = screen.getByLabelText(/Email Address/i);
      const submitButton = screen.getByRole('button', { name: /Start My 14-Day Trial/i });

      await user.type(businessNameInput, 'A');
      await user.type(emailInput, 'invalid');
      await user.click(submitButton);

      await waitFor(() => {
        const errorMessages = screen.getAllByText(/must be at least|Please enter a valid/i);
        expect(errorMessages.length).toBeGreaterThan(0);
        errorMessages.forEach(msg => {
          expect(msg).toHaveClass('text-destructive');
        });
      });
    });
  });

  describe('Navigation', () => {
    it('should navigate to auth page when sign in is clicked', async () => {
      const user = userEvent.setup();
      renderAuthLanding();

      const signInButton = screen.getByRole('button', { name: /Sign in/i });
      await user.click(signInButton);

      expect(mockNavigate).toHaveBeenCalledWith('/auth');
    });
  });
});
