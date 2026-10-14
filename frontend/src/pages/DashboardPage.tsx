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
            <div key={i} className="rounded-[6px] border border-border bg-card p-4 space-y-3">
              <Skeleton className="h-4 w-24 bg-secondary" />
              <Skeleton className="h-8 w-16 bg-secondary" />
              <Skeleton className="h-3 w-32 bg-secondary" />
            </div>
          ))}
        </div>

        {/* Telemetry and Alert widgets skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-[6px] border border-border bg-card p-4 h-64 space-y-3">
            <Skeleton className="h-5 w-40 bg-secondary" />
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-20 bg-secondary" />
              <Skeleton className="h-20 bg-secondary" />
              <Skeleton className="h-20 bg-secondary" />
              <Skeleton className="h-20 bg-secondary" />
            </div>
          </div>
          <div className="rounded-[6px] border border-border bg-card p-4 h-64 space-y-3">
            <Skeleton className="h-5 w-40 bg-secondary" />
            <div className="space-y-2">
              <Skeleton className="h-12 bg-secondary" />
              <Skeleton className="h-12 bg-secondary" />
              <Skeleton className="h-12 bg-secondary" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[6px] border border-[#e5484d]/40 bg-[#e5484d]/10 p-4 text-[#e5484d]">
        <div className="flex items-center gap-2 font-semibold text-sm">
          <AlertTriangle className="h-4 w-4 text-[#e5484d]" aria-hidden="true" />
          <span>Error loading monitoring dashboard</span>
        </div>
        <p className="text-xs mt-1 text-foreground">{error}</p>
        <button
          type="button"
          onClick={fetchData}
          className="mt-3 px-3 py-1.5 rounded-[6px] bg-secondary hover:bg-muted border border-border text-xs font-semibold text-muted-foreground transition-colors"
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground dark:text-white">
            Dashboard
          </h2>
          <p className="text-sm text-[#8b9bb4] mt-1 leading-[21px]">
            Overview of your monitoring platform
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/discovery"
            className="flex items-center gap-1.5 h-8 px-3 py-[5px] rounded-[6px] border border-border bg-secondary hover:bg-muted hover:border-[#8b949e] text-sm font-medium text-foreground hover:text-white transition-colors shadow-[rgba(61,68,77,0.7)_0px_-1px_0px_0px_inset]"
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
        {/* Node Infrastructure Overview - Styled with Linear Monolith */}
        <div className="linear-monolith overflow-hidden">
          {/* Linear Header */}
          <div className="linear-header flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-lg font-semibold text-foreground dark:text-white tracking-tight">
                Targets
              </h3>
            </div>

            {/* Button to Grafana to show full metrics dashboard */}
            <div className="flex items-center gap-2 shrink-0">
              <a
                href="http://localhost:3001/d/Main-Dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 h-8 px-3 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-medium text-foreground transition-colors shadow-xs"
                title="Open full metrics dashboard in Grafana"
              >
                <BarChart3 className="h-3.5 w-3.5 text-[#d29922]" aria-hidden="true" />
                <span>Grafana</span>
                <ExternalLink className="h-3 w-3 opacity-60" aria-hidden="true" />
              </a>
            </div>
          </div>

          <div className="p-3.5">
            {targets.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground leading-[21px]">
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
                      className="linear-card p-3.5 flex flex-col justify-between transition-all duration-150"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="linear-pill shrink-0">
                              #{target.id}
                            </span>
                            <span
                              className="text-sm font-semibold text-foreground dark:text-white truncate"
                              title={target.name}
                            >
                              {target.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {target.health === "up" ? (
                              <Badge variant="success" className="text-xs px-1.5 py-0.5 shrink-0 gap-1" title="Node exporter responding nominal">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#3fb950]" />
                                UP
                              </Badge>
                            ) : target.health === "down" ? (
                              <Badge variant="destructive" className="text-xs px-1.5 py-0.5 shrink-0 gap-1" title={target.last_error || "Target is offline"}>
                                <span className="h-1.5 w-1.5 rounded-full bg-[#e5484d] shadow-[0_0_6px_rgba(229,72,77,0.6)]" />
                                DOWN
                              </Badge>
                            ) : !target.is_active || target.health === "muted" ? (
                              <Badge variant="outline" className="text-xs px-1.5 py-0.5 shrink-0 gap-1 text-muted-foreground" title="Target scraping disabled">
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
                          className="mt-2 tabular-nums text-xs font-mono text-muted-foreground break-all"
                          title={`${target.ip_address}:${port}`}
                        >
                          {target.ip_address}:{port}
                        </p>

                        {target.health === "down" && (
                          <p className="mt-1 text-[11px] font-mono text-[#e5484d] truncate" title={target.last_error || "Offline"}>
                            Offline (Scrape timeout)
                          </p>
                        )}
                      </div>

                      <div className="mt-3 pt-2 border-t border-white/[0.06] dark:border-white/[0.06] border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground font-mono text-[11px] uppercase">
                          {target.environment || "production"}
                        </span>
                        <a
                          href={grafanaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[#434eb0] dark:text-[#8b95f6] hover:text-[#5e6ad2] dark:hover:text-[#a5b4fc] hover:underline text-xs font-medium"
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

          {/* Footer with view all link */}
          <div className="linear-footer flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-mono">
              Showing {Math.min(targets.length, 6)} of {targets.length} targets
            </span>
            <Link
              to="/targets"
              className="flex items-center gap-1 text-[#434eb0] dark:text-[#8b95f6] hover:text-[#5e6ad2] dark:hover:text-[#a5b4fc] hover:underline font-medium"
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

