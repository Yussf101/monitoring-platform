import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TargetTable } from '../components/TargetTable';
import type { Target } from '../lib/types';

describe('TargetTable Component', () => {
  const mockTargets: Target[] = [
    {
      id: 1,
      name: 'prod-api-01',
      ip_address: '192.168.1.100',
      port: 9100,
      os_type: 'linux',
      environment: 'production',
      ssh_user: 'youssef',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 2,
      name: 'staging-db-01',
      ip_address: '192.168.1.105',
      port: 9100,
      os_type: 'ubuntu',
      environment: 'staging',
      ssh_user: 'deploy',
      is_active: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  ];

  it('renders targets list with names and IP addresses', () => {
    render(<TargetTable targets={mockTargets} onDelete={() => {}} />);

    expect(screen.getByText('prod-api-01')).toBeInTheDocument();
    expect(screen.getByText(/192\.168\.1\.100/)).toBeInTheDocument();
    expect(screen.getByText('staging-db-01')).toBeInTheDocument();
  });

  it('displays empty state when no targets provided', () => {
    render(<TargetTable targets={[]} onDelete={() => {}} />);

    expect(screen.getByText(/No monitored targets found/i)).toBeInTheDocument();
  });
});
