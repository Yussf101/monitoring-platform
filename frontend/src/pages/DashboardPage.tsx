import { useEffect, useState, useCallback } from 'react';
import { getTargets, getAlerts } from '../lib/api';
import type { Target, Alert } from '../lib/types';
import { StatCard } from '../components/StatCard';
import { RecentAlerts } from '../components/RecentAlerts';
import { AddTargetModal } from '../components/AddTargetModal';
import { Skeleton } from '../components/ui/skeleton';
import { 
  Server, 
  AlertTriangle, 
  ShieldCheck, 
  ArrowRight,
  BarChart2,
  BarChart3,
  ExternalLink,
  Radio
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '../components/ui/badge';

interface DashboardPageProps {
  refreshTrigger?: number;
}

export function DashboardPage({ refreshTrigger = 0 }: DashboardPageProps) {
  const [targets, setTargets] = useState<Target[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [fetchedTargets, fetchedAlerts] = await Promise.all([
        getTargets(),
        getAlerts()
      ]);
      setTargets(fetchedTargets);
      setAlerts(fetchedAlerts);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshTrigger]);

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#30363d]">
          <div className="space-y-2">
            <Skeleton className="h-6 w-48 bg-[#21262d]" />
            <Skeleton className="h-4 w-72 bg-[#21262d]" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-24 bg-[#21262d]" />
            <Skeleton className="h-8 w-36 bg-[#21262d]" />
          </div>
        </div>

        {/* Stat cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-[6px] border border-[#30363d] bg-[#161b22] p-4 space-y-3">
              <Skeleton className="h-4 w-24 bg-[#21262d]" />
              <Skeleton className="h-8 w-16 bg-[#21262d]" />
              <Skeleton className="h-3 w-32 bg-[#21262d]" />
            </div>
          ))}
        </div>

        {/* Telemetry and Alert widgets skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-[6px] border border-[#30363d] bg-[#161b22] p-4 h-64 space-y-3">
            <Skeleton className="h-5 w-40 bg-[#21262d]" />
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-20 bg-[#21262d]" />
              <Skeleton className="h-20 bg-[#21262d]" />
              <Skeleton className="h-20 bg-[#21262d]" />
              <Skeleton className="h-20 bg-[#21262d]" />
            </div>
          </div>
          <div className="rounded-[6px] border border-[#30363d] bg-[#161b22] p-4 h-64 space-y-3">
            <Skeleton className="h-5 w-40 bg-[#21262d]" />
            <div className="space-y-2">
              <Skeleton className="h-12 bg-[#21262d]" />
              <Skeleton className="h-12 bg-[#21262d]" />
              <Skeleton className="h-12 bg-[#21262d]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[6px] border border-[#f85149]/40 bg-[#f85149]/10 p-4 text-[#f85149]">
        <div className="flex items-center gap-2 font-semibold text-sm">
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          <span>Error loading monitoring dashboard</span>
        </div>
        <p className="text-xs mt-1 text-[#e6edf3]">{error}</p>
        <button
          type="button"
          onClick={fetchData}
          className="mt-3 px-3 py-1.5 rounded-[6px] bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-xs font-semibold text-[#c9d1d9] transition-colors"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const activeTargets = targets.filter(t => t.is_active);
  const upTargets = targets.filter(t => t.is_active && t.health === 'up');
  const downTargets = targets.filter(t => t.is_active && t.health === 'down');
  const firingAlerts = alerts.filter(a => a.status === 'firing');
  const criticalFiring = firingAlerts.filter(a => a.severity === 'critical');
  const availabilityRate = activeTargets.length > 0 
    ? Math.round((upTargets.length / activeTargets.length) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Subhead Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#30363d]">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#f0f6fc]">
            Dashboard
          </h2>
          <p className="text-sm text-[#7d8590] mt-1 leading-[21px]">
            Infrastructure health overview and active incidents.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/discovery"
            className="flex items-center gap-1.5 h-8 px-3 py-[5px] rounded-[6px] border border-[#30363d] bg-[#212830] hover:bg-[#30363d] hover:border-[#8b949e] text-sm font-medium text-[#f0f6fc] hover:text-white transition-colors shadow-[rgba(61,68,77,0.7)_0px_-1px_0px_0px_inset]"
          >
            <Radio className="h-3.5 w-3.5 text-[#4493f8]" aria-hidden="true" />
            <span>Discovery</span>
          </Link>
          <AddTargetModal onSuccess={fetchData} />
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatCard
          title="Monitored Nodes"
          value={targets.length}
          icon={Server}
          accent="indigo"
          description={`${upTargets.length} online, ${downTargets.length} offline, ${targets.length - activeTargets.length} muted`}
          subtitleRight={`${availabilityRate}% Up`}
        />

        <StatCard
          title="Cluster Health"
          value={`${availabilityRate}%`}
          icon={ShieldCheck}
          accent={availabilityRate === 100 ? "emerald" : (availabilityRate === 0 ? "rose" : "amber")}
          description={
            availabilityRate === 100 
              ? "All scrape vectors responding nominal" 
              : availabilityRate === 0
              ? "All active monitored nodes are offline / unreachable"
              : `${downTargets.length} node(s) unreachable on scrape port`
          }
          trend={{ 
            label: availabilityRate === 100 ? "Nominal" : (availabilityRate === 0 ? "Offline" : "Degraded"), 
            isPositive: availabilityRate === 100 
          }}
        />

        <StatCard
          title="Active Incidents"
          value={firingAlerts.length}
          icon={AlertTriangle}
          accent={firingAlerts.length > 0 ? "rose" : "emerald"}
          description={firingAlerts.length === 0 ? "Webhook receiver quiet — 0 firing alerts" : `${criticalFiring.length} critical threshold alerts firing`}
          trend={firingAlerts.length > 0 ? { label: "Action Needed", isPositive: false } : { label: "Zero Firing", isPositive: true }}
        />
      </div>

      {/* Primary Split: Node Infrastructure Overview (with Grafana button) & Recent Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {/* Node Infrastructure Overview */}
        <div className="rounded-[6px] border border-[#30363d] bg-[#161b22] overflow-hidden shadow-[0_1px_0_rgba(27,31,36,0.1)]">
          {/* Title Header with darker background to distinguish from content */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 border-b border-[#30363d] bg-[#010409] gap-2">
            <div>
              <h3 className="text-sm font-semibold text-[#f0f6fc]">
                Targets
              </h3>
              <p className="text-xs text-[#7d8590] mt-0.5 leading-[18px]">
                Registered scrape endpoints
              </p>
            </div>

            {/* Button to Grafana to show full metrics dashboard */}
            <div className="flex items-center gap-2 shrink-0">
              <a
                href="http://localhost:3001/d/Main-Dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 h-8 px-3 py-1 rounded-[6px] bg-[#212830] hover:bg-[#30363d] border border-[#30363d] hover:border-[#8b949e] text-xs font-medium text-[#f0f6fc] hover:text-white transition-colors shadow-[rgba(61,68,77,0.7)_0px_-1px_0px_0px_inset]"
                title="Open full metrics dashboard in Grafana"
              >
                <BarChart3 className="h-3.5 w-3.5 text-[#d29922]" aria-hidden="true" />
                <span>Grafana</span>
                <ExternalLink className="h-3 w-3 opacity-60" aria-hidden="true" />
              </a>
            </div>
          </div>

          <div className="p-3 bg-[#0d1117]">
            {targets.length === 0 ? (
              <div className="py-8 text-center text-sm text-[#7d8590] leading-[21px]">
                No targets registered yet. Add one above to get started.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {targets.slice(0, 6).map((target) => {
                  const port = target.port || 9100;
                  const grafanaUrl = `http://localhost:3001/d/Main-Dashboard?var-instance=${target.ip_address}:${port}`;

                  return (
                    <div
                      key={target.id}
                      className="rounded-[6px] border border-[#30363d] bg-[#161b22] p-3 flex flex-col justify-between hover:border-[#8b949e] transition-colors"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <span 
                            className="text-sm font-semibold text-[#f0f6fc] break-words" 
                            title={target.name}
                          >
                            {target.name}
                          </span>
                          <div className="flex items-center gap-1">
                            {target.health === "up" ? (
                              <Badge variant="success" className="text-xs px-1.5 py-0.5 shrink-0 gap-1" title="Node exporter responding nominal">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#3fb950]" />
                                UP
                              </Badge>
                            ) : target.health === "down" ? (
                              <Badge variant="destructive" className="text-xs px-1.5 py-0.5 shrink-0 gap-1" title={target.last_error || "Target is offline"}>
                                <span className="h-1.5 w-1.5 rounded-full bg-[#f85149]" />
                                DOWN
                              </Badge>
                            ) : !target.is_active || target.health === "muted" ? (
                              <Badge variant="outline" className="text-xs px-1.5 py-0.5 shrink-0 gap-1 text-[#7d8590]" title="Target scraping disabled">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#6e7681]" />
                                MUTED
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs px-1.5 py-0.5 shrink-0 gap-1 text-[#d29922]" title="Scrape status unknown">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#d29922]" />
                                UNKNOWN
                              </Badge>
                            )}
                          </div>
                        </div>

                        <p 
                          className="mt-1.5 tabular-nums text-xs font-mono text-[#7d8590] break-all" 
                          title={`${target.ip_address}:${port}`}
                        >
                          {target.ip_address}:{port}
                        </p>

                        {target.health === "down" && (
                          <p className="mt-1 text-[11px] font-mono text-[#f85149] truncate" title={target.last_error || "Offline"}>
                            Offline (Scrape timeout)
                          </p>
                        )}
                      </div>

                      <div className="mt-3 pt-2 border-t border-[#21262d] flex items-center justify-between text-xs">
                        <span className="text-[#7d8590] font-mono text-[11px] uppercase">
                          {target.environment || "production"}
                        </span>
                        <a
                          href={grafanaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[#4493f8] hover:underline text-xs font-medium"
                          title="Open node metrics in Grafana"
                        >
                          <BarChart2 className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Metrics</span>
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer with view all link - hugs the bottom of previewed nodes */}
          <div className="px-4 py-2.5 border-t border-[#30363d] bg-[#161b22] flex items-center justify-between text-xs">
            <span className="text-[#7d8590]">
              Showing {Math.min(targets.length, 6)} of {targets.length} targets
            </span>
            <Link
              to="/targets"
              className="flex items-center gap-1 text-[#4493f8] hover:underline font-medium"
            >
              <span>Manage all targets</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/* Column 2: Recent Incidents */}
        <RecentAlerts alerts={alerts} />
      </div>
    </div>
  );
}

