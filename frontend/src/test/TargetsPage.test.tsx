import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TargetsPage } from '../pages/TargetsPage';

vi.mock('../lib/api', () => ({
  getTargets: vi.fn().mockResolvedValue([
    {
      id: 1,
      name: 'node-01',
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
  deleteTarget: vi.fn().mockResolvedValue(undefined),
}));

describe('TargetsPage Component', () => {
  it('renders Targets heading and search controls', async () => {
    render(
      <MemoryRouter>
        <TargetsPage />
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: /^targets$/i })).toBeInTheDocument();
  });
});
