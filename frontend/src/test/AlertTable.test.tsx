import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AlertTable } from '../components/AlertTable';
import type { Alert } from '../lib/types';

describe('AlertTable Component', () => {
  const mockAlerts: Alert[] = [
    {
      id: 1,
      target_id: 1,
      alert_name: 'InstanceDown',
      severity: 'critical',
      status: 'firing',
      message: 'Target has been down for more than 1 minute',
      fired_at: new Date().toISOString(),
      resolved_at: null,
      created_at: new Date().toISOString(),
    }
  ];

  it('renders alerts with alert_name and status', () => {
    render(<AlertTable alerts={mockAlerts} />);

    expect(screen.getByText('InstanceDown')).toBeInTheDocument();
    expect(screen.getByText('FIRING')).toBeInTheDocument();
  });

  it('renders empty state when no alerts match', () => {
    render(<AlertTable alerts={[]} />);

    expect(screen.getByText(/No alert incidents recorded/i)).toBeInTheDocument();
  });
});
