import { Activity, Cpu, HardDrive, Database, Gauge, ExternalLink } from 'lucide-react';

interface TelemetryWidgetProps {
  cpuPercent?: number | null;
  memoryPercent?: number | null;
  diskPercent?: number | null;
  load1m?: number | null;
  activeTargetsCount?: number;
  lastUpdated?: string;
}

export function TelemetryWidget({
  cpuPercent = null,
  memoryPercent = null,
  diskPercent = null,
  load1m = null,
  activeTargetsCount = 0,
  lastUpdated
}: TelemetryWidgetProps) {
  const getProgressColor = (val: number | null) => {
    if (val === null) return 'bg-[#30363d]';
    if (val > 85) return 'bg-[#f85149]';
    if (val > 70) return 'bg-[#d29922]';
    return 'bg-[#2ea043]';
  };

  const getTextColor = (val: number | null) => {
    if (val === null) return 'text-[#848d97]';
    if (val > 85) return 'text-[#f85149] font-semibold';
    if (val > 70) return 'text-[#d29922] font-semibold';
    return 'text-[#3fb950] font-medium';
  };

  return (
    <div className="rounded-[6px] border border-border bg-card shadow-[0_1px_0_rgba(27,31,36,0.1)] flex flex-col justify-between overflow-hidden">
      <div>
        {/* Box Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-secondary border border-border text-muted-foreground">
              <Gauge className="h-4 w-4" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-foreground">
                  Telemetry Gauges
                </h3>
              </div>
              <p className="text-sm text-muted-foreground leading-[21px]">
                Aggregated telemetry across instances.
              </p>
            </div>
          </div>

          <a
            href="http://localhost:3001/d/Main-Dashboard"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open Live Grafana dashboard in new tab"
            className="flex items-center gap-1.5 h-8 px-3 py-[5px] rounded-[6px] bg-secondary hover:bg-muted border border-border text-sm font-medium text-foreground hover:text-white transition-colors shadow-[rgba(61,68,77,0.7)_0px_-1px_0px_0px_inset]"
          >
            <span>Grafana</span>
            <ExternalLink className="h-3.5 w-3.5 opacity-60" aria-hidden="true" />
          </a>
        </div>

        {/* Gauges Grid */}
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* CPU Gauge */}
          <div className="rounded-[6px] border border-border bg-background p-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-foreground">
                <Cpu className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <span className="font-medium">CPU Utilization</span>
              </div>
              <span className={`font-mono tabular-nums text-sm ${getTextColor(cpuPercent)}`}>
                {cpuPercent !== null ? `${cpuPercent.toFixed(1)}%` : '--'}
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-border/50 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${getProgressColor(cpuPercent)}`}
                style={{ width: cpuPercent !== null ? `${Math.min(Math.max(cpuPercent, 0), 100)}%` : '0%' }}
              />
            </div>
          </div>

          {/* Memory Gauge */}
          <div className="rounded-[6px] border border-border bg-background p-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-foreground">
                <Database className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <span className="font-medium">Memory Pool</span>
              </div>
              <span className={`font-mono tabular-nums text-sm ${getTextColor(memoryPercent)}`}>
                {memoryPercent !== null ? `${memoryPercent.toFixed(1)}%` : '--'}
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-border/50 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${getProgressColor(memoryPercent)}`}
                style={{ width: memoryPercent !== null ? `${Math.min(Math.max(memoryPercent, 0), 100)}%` : '0%' }}
              />
            </div>
          </div>

          {/* Disk Gauge */}
          <div className="rounded-[6px] border border-border bg-background p-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-foreground">
                <HardDrive className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <span className="font-medium">Storage / Disk</span>
              </div>
              <span className={`font-mono tabular-nums text-sm ${getTextColor(diskPercent)}`}>
                {diskPercent !== null ? `${diskPercent.toFixed(1)}%` : '--'}
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-border/50 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${getProgressColor(diskPercent)}`}
                style={{ width: diskPercent !== null ? `${Math.min(Math.max(diskPercent, 0), 100)}%` : '0%' }}
              />
            </div>
          </div>

          {/* Load Gauge */}
          <div className="rounded-[6px] border border-border bg-background p-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-foreground">
                <Activity className="h-4 w-4 text-[#d29922]" aria-hidden="true" />
                <span className="font-medium">Load Average (1m)</span>
              </div>
              <span className="font-mono tabular-nums text-sm text-foreground">
                {load1m !== null ? `${load1m.toFixed(2)}` : '--'}
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-border/50 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#d29922] transition-all duration-300"
                style={{ width: load1m !== null ? `${Math.min(Math.max(load1m * 25, 0), 100)}%` : '0%' }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-2.5 border-t border-border bg-card flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-mono text-xs">Scraping {activeTargetsCount} active target streams</span>
        {lastUpdated ? (
          <span className="font-mono text-xs">Updated: {lastUpdated}</span>
        ) : (
          <span className="text-[#3fb950] flex items-center gap-1.5 font-mono text-xs">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#3fb950]" />
            Streaming
          </span>
        )}
      </div>
    </div>
  );
}
