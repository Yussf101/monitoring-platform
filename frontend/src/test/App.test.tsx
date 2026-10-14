import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';

vi.mock('./lib/api', () => ({
  getTargets: vi.fn().mockResolvedValue([]),
  getAlerts: vi.fn().mockResolvedValue([]),
  getMetricSummary: vi.fn().mockResolvedValue([]),
  getLatestMetrics: vi.fn().mockResolvedValue([]),
  getHealth: vi.fn().mockResolvedValue({ status: 'ok', service: 'monitoring-platform' }),
}));

describe('App Root Component', () => {
  it('renders application with sidebar and navigation', async () => {
    render(<App />);

    expect(await screen.findByText(/Monitoring Platform/i)).toBeInTheDocument();
  });
});
