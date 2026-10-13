import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Header } from '../components/Header';

vi.mock('../lib/api', () => ({
  getHealth: vi.fn().mockResolvedValue({ status: 'ok', service: 'monitoring-platform' }),
}));

describe('Header Component', () => {
  it('renders target counts and controls with accessible labels', async () => {
    const handleRefresh = vi.fn();
    const handleSearchChange = vi.fn();

    render(
      <MemoryRouter>
        <Header
          autoRefreshInterval={30}
          onAutoRefreshChange={() => {}}
          onRefresh={handleRefresh}
          totalTargets={10}
          firingAlerts={0}
          searchQuery="prod"
          onSearchChange={handleSearchChange}
        />
      </MemoryRouter>
    );

    expect(screen.getByText('Monitoring Platform')).toBeInTheDocument();
    expect(screen.getByText('Targets')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('0 Firing')).toBeInTheDocument();

    const refreshBtn = screen.getByLabelText(/Refresh telemetry data now/i);
    expect(refreshBtn).toBeInTheDocument();
    fireEvent.click(refreshBtn);
    expect(handleRefresh).toHaveBeenCalled();

    const clearBtn = screen.getByLabelText(/Clear search input/i);
    expect(clearBtn).toBeInTheDocument();
    fireEvent.click(clearBtn);
    expect(handleSearchChange).toHaveBeenCalledWith('');

    // Wait for the mounted getHealth check to complete cleanly
    await screen.findByText(/API Connected/i);
  });
});
