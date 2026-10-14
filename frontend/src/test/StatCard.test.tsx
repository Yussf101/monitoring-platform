import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatCard } from '../components/StatCard';
import { Server } from 'lucide-react';

describe('StatCard Component', () => {
  it('renders title and value', () => {
    render(
      <StatCard
        title="Total Targets"
        value={12}
        icon={Server}
        description="Active endpoints"
      />
    );

    expect(screen.getByText('Total Targets')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('Active endpoints')).toBeInTheDocument();
  });

  it('renders trend badge when provided', () => {
    render(
      <StatCard
        title="Firing Incidents"
        value={2}
        icon={Server}
        trend={{ label: '+2 this hour', isPositive: false }}
      />
    );

    expect(screen.getByText('+2 this hour')).toBeInTheDocument();
  });

  it('applies accent styles to the icon container', () => {
    const { container } = render(
      <StatCard
        title="Firing Incidents"
        value={2}
        icon={Server}
        accent="rose"
      />
    );

    const iconWrapper = container.querySelector('[aria-hidden="true"]');
    expect(iconWrapper?.className).toContain('text-[#f85149]');
  });
});
