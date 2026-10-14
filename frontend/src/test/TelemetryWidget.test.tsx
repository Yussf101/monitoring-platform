import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TelemetryWidget } from '../components/TelemetryWidget';

describe('TelemetryWidget Component', () => {
  it('renders telemetry gauges with values', () => {
    render(
      <TelemetryWidget
        cpuPercent={42.5}
        memoryPercent={68.2}
        diskPercent={55.0}
        load1m={1.24}
        activeTargetsCount={3}
      />
    );

    expect(screen.getByText(/Telemetry Gauges/i)).toBeInTheDocument();
    expect(screen.getByText(/42.5%/i)).toBeInTheDocument();
    expect(screen.getByText(/68.2%/i)).toBeInTheDocument();
    expect(screen.getByText(/55.0%/i)).toBeInTheDocument();
  });

  it('renders clean placeholder dashes instead of fake mock values when metrics are null', () => {
    render(
      <TelemetryWidget
        cpuPercent={null}
        memoryPercent={null}
        diskPercent={null}
        load1m={null}
        activeTargetsCount={0}
      />
    );

    const dashes = screen.getAllByText('--');
    expect(dashes.length).toBeGreaterThanOrEqual(4);
  });
});
