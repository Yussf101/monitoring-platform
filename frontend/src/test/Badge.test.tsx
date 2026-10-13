import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '../components/ui/badge';

describe('Badge Component', () => {
  it('renders default badge correctly', () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders success variant with emerald styling', () => {
    render(<Badge variant="success">Online</Badge>);
    const badge = screen.getByText('Online');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('text-emerald-400');
  });

  it('renders destructive variant with rose styling', () => {
    render(<Badge variant="destructive">Firing</Badge>);
    const badge = screen.getByText('Firing');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('text-rose-400');
  });

  it('renders warning variant with amber styling', () => {
    render(<Badge variant="warning">Degraded</Badge>);
    const badge = screen.getByText('Degraded');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('text-amber-400');
  });
});
