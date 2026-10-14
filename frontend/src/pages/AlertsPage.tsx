import { useEffect, useState, useCallback } from "react";
import { getAlerts } from "../lib/api";
import type { Alert } from "../lib/types";
import { AlertTable } from "../components/AlertTable";
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";
import { 
  AlertTriangle, 
  Search, 
  CheckCircle2, 
  AlertOctagon, 
  RefreshCw,
  Clock
} from "lucide-react";
import { Badge } from "../components/ui/badge";

const PAGE_SIZE = 25;

interface AlertsPageProps {
  refreshTrigger?: number;
}

export function AlertsPage({ refreshTrigger = 0 }: AlertsPageProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");

  const fetchAlerts = useCallback(
    async (currentOffset: number, append: boolean) => {
      if (!append) setIsLoading(true);
      try {
        const data = await getAlerts(PAGE_SIZE, currentOffset);
        if (append) {
          setAlerts((prev) => [...prev, ...data]);
        } else {
          setAlerts(data);
        }
        setHasMore(data.length === PAGE_SIZE);
        setError("");
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to fetch alerts";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchAlerts(0, false);
  }, [fetchAlerts, refreshTrigger]);

  const handleLoadMore = () => {
    const newOffset = offset + PAGE_SIZE;
    setOffset(newOffset);
    fetchAlerts(newOffset, true);
  };

  const firingCount = alerts.filter(a => a.status === 'firing').length;
  const resolvedCount = alerts.filter(a => a.status === 'resolved').length;
  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const warningCount = alerts.filter(a => a.severity === 'warning').length;

  const filteredAlerts = alerts.filter((alert) => {
    if (statusFilter !== "all" && alert.status !== statusFilter) return false;
    if (severityFilter !== "all" && alert.severity !== severityFilter) return false;

    if (search) {
      const q = search.toLowerCase();
      return (
        alert.alert_name.toLowerCase().includes(q) ||
        (alert.message && alert.message.toLowerCase().includes(q)) ||
        alert.target_id.toString().includes(q)
      );
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
              Alerts
            </h2>
            <Badge variant="destructive" className="font-mono tabular-nums text-xs">
              {firingCount} Firing
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1 leading-[21px]">
            Alertmanager webhook events and resolution history.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setOffset(0);
            fetchAlerts(0, false);
          }}
          disabled={isLoading}
          aria-label="Refresh alert history feed"
          className="flex items-center gap-1.5 h-8 px-3 py-[5px] rounded-lg border border-white/10 dark:border-white/10 border-slate-200 bg-white/[0.05] dark:bg-white/[0.05] bg-white hover:bg-white/[0.1] text-sm font-medium text-foreground transition-colors disabled:opacity-50 self-start sm:self-auto shadow-xs"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-primary' : ''}`} aria-hidden="true" />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI Summary Strip with Linear Metallic Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="linear-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Recorded</span>
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-white/[0.05] border border-white/10 text-muted-foreground">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tabular-nums text-foreground tracking-tight">
            {alerts.length}
          </div>
        </div>

        <div className="linear-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[#f85149]">
            <span className="text-xs font-semibold uppercase tracking-wider">Firing Incidents</span>
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#f85149]/10 border border-[#f85149]/20 text-[#f85149]">
              <AlertOctagon className="h-3.5 w-3.5" aria-hidden="true" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tabular-nums text-[#f85149] tracking-tight">
            {firingCount}
          </div>
        </div>

        <div className="linear-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-emerald-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Resolved</span>
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tabular-nums text-emerald-400 tracking-tight">
            {resolvedCount}
          </div>
        </div>

        <div className="linear-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-amber-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Critical / Warning</span>
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tabular-nums text-foreground tracking-tight">
            {criticalCount} <span className="text-xs text-muted-foreground font-normal">/ {warningCount}</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="linear-card p-2.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Query webhook events by rule name, instance, or payload..."
            aria-label="Search alert incident history"
            className="h-8 w-full rounded-lg border border-white/10 dark:border-white/10 border-slate-200 bg-black/30 dark:bg-black/30 bg-white pl-8 pr-8 text-sm leading-[20px] text-foreground placeholder:text-muted-foreground focus:border-[#5e6ad2] focus:outline-none focus:ring-1 focus:ring-[#5e6ad2] transition-colors"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear alert search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter */}
          <div className="flex items-center rounded-lg border border-white/10 dark:border-white/10 border-slate-200 bg-black/40 dark:bg-black/40 bg-slate-100 p-0.5 text-xs" role="tablist" aria-label="Alert status filter">
            <button
              type="button"
              role="tab"
              aria-selected={statusFilter === "all"}
              onClick={() => setStatusFilter("all")}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                statusFilter === "all" ? "bg-[#5e6ad2] text-white font-semibold shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={statusFilter === "firing"}
              onClick={() => setStatusFilter("firing")}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                statusFilter === "firing" ? "bg-[#f85149]/20 text-[#f85149] font-semibold" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Firing ({firingCount})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={statusFilter === "resolved"}
              onClick={() => setStatusFilter("resolved")}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                statusFilter === "resolved" ? "bg-emerald-500/20 text-emerald-500 dark:text-emerald-400 font-semibold" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Resolved ({resolvedCount})
            </button>
          </div>

          {/* Severity filter */}
          <div className="flex items-center rounded-lg border border-white/10 dark:border-white/10 border-slate-200 bg-black/40 dark:bg-black/40 bg-slate-100 p-0.5 text-xs" role="tablist" aria-label="Severity filter">
            <button
              type="button"
              role="tab"
              aria-selected={severityFilter === "all"}
              onClick={() => setSeverityFilter("all")}
              className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                severityFilter === "all" ? "bg-[#5e6ad2] text-white font-semibold shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All Sev
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={severityFilter === "critical"}
              onClick={() => setSeverityFilter("critical")}
              className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                severityFilter === "critical" ? "bg-[#f85149]/20 text-[#f85149] font-semibold" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Critical
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={severityFilter === "warning"}
              onClick={() => setSeverityFilter("warning")}
              className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                severityFilter === "warning" ? "bg-amber-500/20 text-amber-500 dark:text-amber-400 font-semibold" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Warning
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={severityFilter === "info"}
              onClick={() => setSeverityFilter("info")}
              className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                severityFilter === "info" ? "bg-card text-foreground font-semibold shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Info
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-[6px] border border-destructive/40 bg-destructive/10 p-3 text-xs font-medium text-destructive">
          {error}
        </div>
      )}

      {/* Alert Feed */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-[6px] border border-border bg-card p-3.5 space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-40 bg-muted" />
                <Skeleton className="h-4 w-20 bg-muted" />
              </div>
              <Skeleton className="h-3 w-3/4 bg-muted" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <AlertTable alerts={filteredAlerts} />

          {hasMore && (
            <div className="flex justify-center pt-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleLoadMore}
                className="text-xs"
              >
                Load Older Alerts (+{PAGE_SIZE})
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
