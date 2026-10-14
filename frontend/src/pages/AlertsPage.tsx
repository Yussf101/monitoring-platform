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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#30363d]">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#f0f6fc]">
              Alerts
            </h2>
            <Badge variant="destructive" className="font-mono tabular-nums text-xs">
              {firingCount} Firing
            </Badge>
          </div>
          <p className="text-sm text-[#7d8590] mt-1 leading-[21px]">
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
          className="flex items-center gap-1.5 h-8 px-3 py-[5px] rounded-[6px] border border-[#30363d] bg-[#212830] hover:bg-[#30363d] hover:border-[#8b949e] text-sm font-medium text-[#f0f6fc] hover:text-white transition-colors disabled:opacity-50 self-start sm:self-auto shadow-[rgba(61,68,77,0.7)_0px_-1px_0px_0px_inset]"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-[#4493f8]' : ''}`} aria-hidden="true" />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-[6px] border border-[#30363d] bg-[#161b22] p-3.5 shadow-[0_1px_0_rgba(27,31,36,0.1)]">
          <div className="flex items-center justify-between text-xs text-[#7d8590]">
            <span className="text-xs font-semibold uppercase">Total Recorded</span>
            <Clock className="h-4 w-4 text-[#7d8590]" aria-hidden="true" />
          </div>
          <div className="mt-1.5 text-2xl font-semibold tabular-nums text-[#f0f6fc]">
            {alerts.length}
          </div>
        </div>

        <div className="rounded-[6px] border border-[#f85149]/30 bg-[#f85149]/10 p-3.5 shadow-[0_1px_0_rgba(27,31,36,0.1)]">
          <div className="flex items-center justify-between text-xs text-[#f85149]">
            <span className="text-xs font-semibold uppercase">Firing Incidents</span>
            <AlertOctagon className="h-4 w-4 text-[#f85149]" aria-hidden="true" />
          </div>
          <div className="mt-1.5 text-2xl font-semibold tabular-nums text-[#f85149]">
            {firingCount}
          </div>
        </div>

        <div className="rounded-[6px] border border-[#3fb950]/30 bg-[#2ea043]/10 p-3.5 shadow-[0_1px_0_rgba(27,31,36,0.1)]">
          <div className="flex items-center justify-between text-xs text-[#3fb950]">
            <span className="text-xs font-semibold uppercase">Resolved</span>
            <CheckCircle2 className="h-4 w-4 text-[#3fb950]" aria-hidden="true" />
          </div>
          <div className="mt-1.5 text-2xl font-semibold tabular-nums text-[#3fb950]">
            {resolvedCount}
          </div>
        </div>

        <div className="rounded-[6px] border border-[#30363d] bg-[#161b22] p-3.5 shadow-[0_1px_0_rgba(27,31,36,0.1)]">
          <div className="flex items-center justify-between text-xs text-[#d29922]">
            <span className="text-xs font-semibold uppercase">Critical / Warning</span>
            <AlertTriangle className="h-4 w-4 text-[#d29922]" aria-hidden="true" />
          </div>
          <div className="mt-1.5 text-2xl font-semibold tabular-nums text-[#f0f6fc]">
            {criticalCount} <span className="text-xs text-[#7d8590] font-normal">/ {warningCount}</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-[6px] border border-[#30363d] bg-[#161b22] p-2.5 shadow-[0_1px_0_rgba(27,31,36,0.1)]">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7d8590]" aria-hidden="true" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Query webhook events by rule name, instance, or payload..."
            aria-label="Search alert incident history"
            className="h-8 w-full rounded-[6px] border border-[#30363d] bg-[#0d1117] pl-8 pr-8 text-sm leading-[20px] text-[#f0f6fc] placeholder:text-[#7d8590] focus:border-[#4493f8] focus:outline-none focus:ring-1 focus:ring-[#4493f8] transition-colors"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear alert search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#848d97] hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter */}
          <div className="flex items-center rounded-[6px] border border-[#30363d] bg-[#21262d] p-0.5 text-xs" role="tablist" aria-label="Alert status filter">
            <button
              type="button"
              role="tab"
              aria-selected={statusFilter === "all"}
              onClick={() => setStatusFilter("all")}
              className={`px-2.5 py-1 rounded-[4px] text-xs font-medium transition-colors ${
                statusFilter === "all" ? "bg-[#30363d] text-white font-semibold" : "text-[#848d97] hover:text-white"
              }`}
            >
              All
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={statusFilter === "firing"}
              onClick={() => setStatusFilter("firing")}
              className={`px-2.5 py-1 rounded-[4px] text-xs font-medium transition-colors ${
                statusFilter === "firing" ? "bg-[#f85149]/20 text-[#f85149] font-semibold" : "text-[#848d97] hover:text-white"
              }`}
            >
              Firing ({firingCount})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={statusFilter === "resolved"}
              onClick={() => setStatusFilter("resolved")}
              className={`px-2.5 py-1 rounded-[4px] text-xs font-medium transition-colors ${
                statusFilter === "resolved" ? "bg-[#238636]/20 text-[#3fb950] font-semibold" : "text-[#848d97] hover:text-white"
              }`}
            >
              Resolved ({resolvedCount})
            </button>
          </div>

          {/* Severity filter */}
          <div className="flex items-center rounded-[6px] border border-[#30363d] bg-[#21262d] p-0.5 text-xs" role="tablist" aria-label="Severity filter">
            <button
              type="button"
              role="tab"
              aria-selected={severityFilter === "all"}
              onClick={() => setSeverityFilter("all")}
              className={`px-2 py-1 rounded-[4px] text-xs font-medium transition-colors ${
                severityFilter === "all" ? "bg-[#30363d] text-white font-semibold" : "text-[#848d97] hover:text-white"
              }`}
            >
              All Sev
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={severityFilter === "critical"}
              onClick={() => setSeverityFilter("critical")}
              className={`px-2 py-1 rounded-[4px] text-xs font-medium transition-colors ${
                severityFilter === "critical" ? "bg-[#f85149]/20 text-[#f85149] font-semibold" : "text-[#848d97] hover:text-white"
              }`}
            >
              Critical
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={severityFilter === "warning"}
              onClick={() => setSeverityFilter("warning")}
              className={`px-2 py-1 rounded-[4px] text-xs font-medium transition-colors ${
                severityFilter === "warning" ? "bg-[#d29922]/20 text-[#d29922] font-semibold" : "text-[#848d97] hover:text-white"
              }`}
            >
              Warning
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={severityFilter === "info"}
              onClick={() => setSeverityFilter("info")}
              className={`px-2 py-1 rounded-[4px] text-xs font-medium transition-colors ${
                severityFilter === "info" ? "bg-[#30363d] text-white font-semibold" : "text-[#848d97] hover:text-white"
              }`}
            >
              Info
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-[6px] border border-[#f85149]/40 bg-[#f85149]/10 p-3 text-xs font-medium text-[#f85149]">
          {error}
        </div>
      )}

      {/* Alert Feed */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-[6px] border border-[#30363d] bg-[#161b22] p-3.5 space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-40 bg-[#21262d]" />
                <Skeleton className="h-4 w-20 bg-[#21262d]" />
              </div>
              <Skeleton className="h-3 w-3/4 bg-[#21262d]" />
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
