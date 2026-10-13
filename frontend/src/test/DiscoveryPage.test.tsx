import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DiscoveryPage } from '../pages/DiscoveryPage';

describe('DiscoveryPage Component', () => {
  it('renders Prometheus Service Discovery header', () => {
    render(
      <MemoryRouter>
        <DiscoveryPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Prometheus Service Discovery/i)).toBeInTheDocument();
  });
});
