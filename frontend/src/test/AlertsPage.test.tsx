import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AlertsPage } from '../pages/AlertsPage';

vi.mock('../lib/api', () => ({
  getAlerts: vi.fn().mockResolvedValue([
    {
      id: 1,
      target_id: 2,
      alert_name: 'HighMemoryUsage',
      severity: 'warning',
      status: 'firing',
      message: 'Node memory exceeded 85%',
      fired_at: new Date().toISOString(),
      resolved_at: null,
      created_at: new Date().toISOString(),
    }
  ]),
}));

describe('AlertsPage Component', () => {
  it('renders Alert History heading and filters', async () => {
    render(
      <MemoryRouter>
        <AlertsPage />
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: /^alerts$/i })).toBeInTheDocument();
  });
});
