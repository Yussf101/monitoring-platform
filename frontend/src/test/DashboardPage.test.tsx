import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DashboardPage } from '../pages/DashboardPage';

vi.mock('../lib/api', () => ({
  getTargets: vi.fn().mockResolvedValue([
    {
      id: 1,
      name: 'node-exporter-01',
      ip_address: '192.168.1.100',
      port: 9100,
      os_type: 'linux',
      environment: 'production',
      ssh_user: 'youssef',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  ]),
  getAlerts: vi.fn().mockResolvedValue([]),
  getMetricSummary: vi.fn().mockResolvedValue([
    {
      target_id: 1,
      avg_cpu: 28.5,
      avg_memory: 54.2,
      avg_disk: 41.0,
      avg_load: 0.35,
      sample_count: 10,
    }
  ]),
  getLatestMetrics: vi.fn().mockResolvedValue([]),
}));

describe('DashboardPage Component', () => {
  it('renders dashboard heading and telemetry widgets', async () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    expect(await screen.findByText(/Command Center/i)).toBeInTheDocument();
  });
});
