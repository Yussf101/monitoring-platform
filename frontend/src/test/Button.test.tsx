import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from '../components/ui/button';
import { AddTargetModal } from '../components/AddTargetModal';
import { DashboardPage } from '../pages/DashboardPage';
import { TargetsPage } from '../pages/TargetsPage';
import { DiscoveryPage } from '../pages/DiscoveryPage';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../lib/api', () => ({
  getTargets: vi.fn().mockResolvedValue([]),
  getAlerts: vi.fn().mockResolvedValue([]),
  getMetricSummary: vi.fn().mockResolvedValue([]),
  getLatestMetrics: vi.fn().mockResolvedValue([]),
  getDiscovery: vi.fn().mockResolvedValue([]),
  createTarget: vi.fn().mockResolvedValue({}),
}));

describe('Unified Electric Blue Button CTA Palette', () => {
  it('renders primary button variant with Electric Blue styling', () => {
    render(<Button variant="primary">Deploy Target</Button>);
    const btn = screen.getByRole('button', { name: /deploy target/i });
    expect(btn.className).toContain('bg-[#1f6feb]');
    expect(btn.className).toContain('hover:bg-[#388bfd]');
  });

  it('renders default button variant with Electric Blue styling', () => {
    render(<Button variant="default">Save</Button>);
    const btn = screen.getByRole('button', { name: /save/i });
    expect(btn.className).toContain('bg-[#1f6feb]');
    expect(btn.className).toContain('hover:bg-[#388bfd]');
  });

  it('renders AddTargetModal trigger button with Electric Blue styling', () => {
    render(<AddTargetModal onSuccess={() => {}} />);
    const btn = screen.getByRole('button', { name: /^add target$/i });
    expect(btn.className).toContain('bg-[#1f6feb]');
    expect(btn.className).toContain('hover:bg-[#388bfd]');
  });

  it('renders Dashboard with Electric Blue Add Target button', async () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );
    const btn = await screen.findByRole('button', { name: /^add target$/i });
    expect(btn.className).toContain('bg-[#1f6feb]');
    expect(btn.className).toContain('hover:bg-[#388bfd]');
  });

  it('renders Targets with Electric Blue Add Target button', async () => {
    render(
      <MemoryRouter>
        <TargetsPage />
      </MemoryRouter>
    );
    const btn = await screen.findByRole('button', { name: /^add target$/i });
    expect(btn.className).toContain('bg-[#1f6feb]');
    expect(btn.className).toContain('hover:bg-[#388bfd]');
  });

  it('renders Discovery with Electric Blue Copy SD Config button', () => {
    render(
      <MemoryRouter>
        <DiscoveryPage />
      </MemoryRouter>
    );
    const btn = screen.getByRole('button', { name: /copy prometheus http service discovery/i });
    expect(btn.className).toContain('bg-[#1f6feb]');
    expect(btn.className).toContain('hover:bg-[#388bfd]');
  });
});
