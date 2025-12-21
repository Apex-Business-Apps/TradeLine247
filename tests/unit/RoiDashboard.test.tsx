import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import RoiDashboard from '@/components/dashboard/RoiDashboard';

// Mock the supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: vi.fn(),
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn()
        }))
      }))
    }))
  }
}));

// Mock the toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

describe('RoiDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    render(<RoiDashboard />);

    expect(screen.getByText('Loading metrics...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /loading/i })).toBeInTheDocument();
  });

  it('renders feature disabled state when flag is off', async () => {
    const mockSupabase = await import('@/integrations/supabase/client');

    // Mock feature flag as disabled
    mockSupabase.supabase.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: { enabled: false },
            error: null
          })
        }))
      }))
    });

    const { rerender } = render(<RoiDashboard />);

    await waitFor(() => {
      expect(screen.queryByText('Loading metrics...')).not.toBeInTheDocument();
    });

    // Component should not render anything when feature is disabled
    expect(screen.queryByText('ROI Dashboard')).not.toBeInTheDocument();
  });

  it('renders metrics when data is available', async () => {
    const mockSupabase = await import('@/integrations/supabase/client');

    // Mock successful data loading
    mockSupabase.supabase.rpc.mockResolvedValue({
      data: {
        period_start: '2024-12-01T00:00:00Z',
        period_end: '2024-12-31T23:59:59Z',
        hours_saved: 15.3,
        lead_velocity_median_days: 2.4,
        lead_velocity_p90_days: 5.1,
        tasks_completed: 45,
        emails_processed: 23,
        calls_processed: 12,
        bookings_created: 8,
        roi_multiplier: 765
      },
      error: null
    });

    mockSupabase.supabase.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: { enabled: true },
            error: null
          })
        }))
      }))
    });

    render(<RoiDashboard />);

    await waitFor(() => {
      expect(screen.getByText('ROI Dashboard')).toBeInTheDocument();
    });

    // Check main KPI
    expect(screen.getByText('15.3')).toBeInTheDocument();
    expect(screen.getByText('Hours Saved This Month')).toBeInTheDocument();
    expect(screen.getByText('$765 estimated value saved')).toBeInTheDocument();

    // Check metrics grid
    expect(screen.getByText('45')).toBeInTheDocument(); // Tasks completed
    expect(screen.getByText('23')).toBeInTheDocument(); // Emails processed
    expect(screen.getByText('12')).toBeInTheDocument(); // Calls processed
    expect(screen.getByText('8')).toBeInTheDocument(); // Bookings created

    // Check lead velocity
    expect(screen.getByText('2.4')).toBeInTheDocument(); // Median days
    expect(screen.getByText('5.1')).toBeInTheDocument(); // 90th percentile
  });

  it('handles error states gracefully', async () => {
    const mockSupabase = await import('@/integrations/supabase/client');

    // Mock RPC error
    mockSupabase.supabase.rpc.mockRejectedValue(new Error('Database connection failed'));

    mockSupabase.supabase.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: { enabled: true },
            error: null
          })
        }))
      }))
    });

    render(<RoiDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Unable to load ROI metrics')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });
});