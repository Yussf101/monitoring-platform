import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { RecentAlerts } from '../components/RecentAlerts';
import type { Alert } from '../lib/types';

describe('RecentAlerts Component', () => {
  it('renders empty state when no alerts', () => {
    render(
      <MemoryRouter>
        <RecentAlerts alerts={[]} />
      </MemoryRouter>
    );

    expect(screen.getByText(/All Systems Nominal/i)).toBeInTheDocument();
  });

  it('renders alerts when provided', () => {
    const mockAlerts: Alert[] = [
      {
        id: 1,
        target_id: 10,
        alert_name: 'HighCPUUsage',
        severity: 'critical',
        status: 'firing',
        message: 'CPU exceeded 90%',
        fired_at: new Date().toISOString(),
        resolved_at: null,
        created_at: new Date().toISOString()
      }
    ];

    render(
      <MemoryRouter>
        <RecentAlerts alerts={mockAlerts} />
      </MemoryRouter>
    );

    expect(screen.getByText('HighCPUUsage')).toBeInTheDocument();
    expect(screen.getByText('FIRING')).toBeInTheDocument();
    expect(screen.getByText('critical')).toBeInTheDocument();
  });
});
