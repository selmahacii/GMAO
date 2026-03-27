// Dashboard Component Tests
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Dashboard } from '@/components/pages/Dashboard';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading skeleton while fetching', () => {
    mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<Dashboard />);

    // Check for loading skeleton cards
    const skeletons = screen.getAllByText('').filter(el =>
      el.closest('.animate-pulse')
    );
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders 5 KPI cards on load', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({
        kpis: {
          availability: '94.5',
          mtbf: 2450,
          mttr: '4.2',
          workOrdersInProgress: 12,
          workOrdersCompleted: 234,
          workOrdersThisMonth: 45,
          pmCompliance: '87',
          monthlyCost: 125000,
          criticalAlerts: 0,
          lowStockParts: 5,
          totalAssets: 150,
          operationalAssets: 142,
          technicians: 15,
        },
        woByType: [],
        woByStatus: [],
        workOrdersByMonth: [],
        topDowntimeAssets: [],
        failureModes: [],
        recentAlerts: [],
        upcomingPMs: [],
        technicianWorkload: [],
      }),
    });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Disponibilité')).toBeInTheDocument();
    });

    // Check for all KPI titles
    expect(screen.getByText('MTBF Moyen')).toBeInTheDocument();
    expect(screen.getByText('OTs en cours')).toBeInTheDocument();
    expect(screen.getByText('Conformité PM')).toBeInTheDocument();
    expect(screen.getByText('Coût Maintenance')).toBeInTheDocument();
  });

  it('shows critical alert banner when alerts exist', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({
        kpis: {
          availability: '94.5',
          mtbf: 2450,
          mttr: '4.2',
          workOrdersInProgress: 12,
          workOrdersCompleted: 234,
          workOrdersThisMonth: 45,
          pmCompliance: '87',
          monthlyCost: 125000,
          criticalAlerts: 3,
          lowStockParts: 5,
          totalAssets: 150,
          operationalAssets: 142,
          technicians: 15,
        },
        woByType: [],
        woByStatus: [],
        workOrdersByMonth: [],
        topDowntimeAssets: [],
        failureModes: [],
        recentAlerts: [],
        upcomingPMs: [],
        technicianWorkload: [],
      }),
    });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/alertes critiques nécessitent/)).toBeInTheDocument();
    });

    expect(screen.getByText('Voir les alertes')).toBeInTheDocument();
  });

  it('shows error state if API returns 500', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Erreur/i)).toBeInTheDocument();
    });
  });

  it('renders OEE section', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({
        kpis: {
          availability: '94.5',
          mtbf: 2450,
          mttr: '4.2',
          workOrdersInProgress: 12,
          workOrdersCompleted: 234,
          workOrdersThisMonth: 45,
          pmCompliance: '87',
          monthlyCost: 125000,
          criticalAlerts: 0,
          lowStockParts: 5,
          totalAssets: 150,
          operationalAssets: 142,
          technicians: 15,
        },
        woByType: [],
        woByStatus: [],
        workOrdersByMonth: [],
        topDowntimeAssets: [],
        failureModes: [],
        recentAlerts: [],
        upcomingPMs: [],
        technicianWorkload: [],
      }),
    });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('OEE - Overall Equipment Effectiveness')).toBeInTheDocument();
    });
  });
});
