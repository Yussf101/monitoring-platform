import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';

describe('Sidebar Component', () => {
  it('renders primary navigation links', () => {
    render(
      <MemoryRouter>
        <Sidebar targetCount={5} firingCount={2} />
      </MemoryRouter>
    );

    expect(screen.getByText('Navigation')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Targets')).toBeInTheDocument();
    expect(screen.getByText('Alerts')).toBeInTheDocument();
    expect(screen.getByText('Discovery')).toBeInTheDocument();
  });

  it('displays counts for targets and firing alerts', () => {
    render(
      <MemoryRouter>
        <Sidebar targetCount={8} firingCount={3} />
      </MemoryRouter>
    );

    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});
