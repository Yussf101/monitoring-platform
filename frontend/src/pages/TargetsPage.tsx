import { useEffect, useState, useCallback, useRef } from "react";
import { getTargets, deleteTarget } from "../lib/api";
import type { Target } from "../lib/types";
import { TargetTable } from "../components/TargetTable";
import { AddTargetModal } from "../components/AddTargetModal";
import { Skeleton } from "../components/ui/skeleton";
import { Search, Filter, RefreshCw } from "lucide-react";

interface TargetsPageProps {
  refreshTrigger?: number;
}

export function TargetsPage({ refreshTrigger = 0 }: TargetsPageProps) {
  const [targets, setTargets] = useState<Target[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [envFilter, setEnvFilter] = useState<string>("all");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const fetchTargets = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getTargets();
      setTargets(data);
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to fetch targets");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTargets();
  }, [fetchTargets, refreshTrigger]);

  const handleDelete = async (id: number) => {
    try {
      await deleteTarget(id);
      await fetchTargets();
    } catch (err: any) {
      setError(err.message || "Failed to delete target");
    }
  };

  const activeCount = targets.filter(t => t.is_active).length;
  const environments = Array.from(new Set(targets.map(t => t.environment).filter(Boolean)));

  const filteredTargets = targets.filter(target => {
    if (statusFilter === "active" && !target.is_active) return false;
    if (statusFilter === "inactive" && target.is_active) return false;

    if (envFilter !== "all" && target.environment !== envFilter) return false;

    if (search) {
      const q = search.toLowerCase();
      return (
        target.name.toLowerCase().includes(q) ||
        target.ip_address.toLowerCase().includes(q) ||
        target.environment?.toLowerCase().includes(q) ||
        target.os_type?.toLowerCase().includes(q)
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
            <h2 className="text-gl sm:text-2xl font-semibold tracking-tight text-foreground">
              Targets
            </h2>
            <span className="linear-pill">
              {targets.length}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1 leading-[21px]">
            Node endpoints registered for Prometheus scraping.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchTargets}
            disabled={isLoading}
            aria-label="Refresh target list"
            className="flex items-center gap-1.5 h-8 px-3 py-[5px] rounded-lg border border-white/10 dark:border-white/10 border-slate-200 bg-white/[0.05] dark:bg-white/[0.05] bg-white hover:bg-white/[0.1] text-sm font-medium text-foreground transition-colors disabled:opacity-50 shadow-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-primary' : ''}`} aria-hidden="true" />
            <span>Refresh</span>
          </button>
          <AddTargetModal onSuccess={fetchTargets} />
        </div>
      </div>
      
      {/* Search & Filter Toolbar */}
      <div className="linear-card p-2.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            ref={searchInputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter target inventory by host, subnet, or tags..."
            aria-label="Filter target inventory"
            className="h-8 w-full rounded-lg border border-white/10 dark:border-white/10 border-slate-200 bg-black/30 dark:bg-black/30 bg-white pl-8 pr-8 text-sm leading-[20px] text-foreground placeholder:text-muted-foreground focus:border-[#e5484d] focus:outline-none focus:ring-1 focus:ring-[#e5484d] transition-colors"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear filter text"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          )}
        </div>

        {/* Status and Environment Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-lg border border-white/10 dark:border-white/10 border-slate-200 bg-black/40 dark:bg-black/40 bg-slate-100 p-0.5 text-xs" role="tablist" aria-label="Status filter">
            <button
              type="button"
              role="tab"
              aria-selected={statusFilter === "all"}
              onClick={() => setStatusFilter("all")}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                statusFilter === "all" ? "bg-[#e5484d] text-white font-semibold shadow-[0_0_10px_rgba(229,72,77,0.35)]" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All ({targets.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={statusFilter === "active"}
              onClick={() => setStatusFilter("active")}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                statusFilter === "active" ? "bg-emerald-500/20 text-emerald-500 dark:text-emerald-400 font-semibold" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Active ({activeCount})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={statusFilter === "inactive"}
              onClick={() => setStatusFilter("inactive")}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                statusFilter === "inactive" ? "bg-[#e5484d]/20 text-[#e5484d] font-semibold border border-[#e5484d]/40" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Muted ({targets.length - activeCount})
            </button>
          </div>

          {environments.length > 0 && (
            <div className="flex items-center gap-1.5 rounded-lg border border-white/10 dark:border-white/10 border-slate-200 bg-black/30 dark:bg-black/30 bg-white px-2.5 py-1 text-xs">
              <Filter className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
              <select
                value={envFilter}
                onChange={(e) => setEnvFilter(e.target.value)}
                aria-label="Filter by environment tier"
                className="bg-transparent text-xs text-muted-foreground hover:text-foreground focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-card">All Envs</option>
                {environments.map((env) => (
                  <option key={env} value={env} className="bg-card">
                    {env}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-[6px] border border-destructive/40 bg-destructive/10 p-3 text-xs font-medium text-destructive">
          {error}
        </div>
      )}

      {/* Target Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-[6px] border border-border bg-card p-4 space-y-3">
              <div className="flex justify-between">
                <Skeleton className="h-5 w-32 bg-secondary" />
                <Skeleton className="h-4 w-12 bg-secondary" />
              </div>
              <Skeleton className="h-8 w-full bg-secondary" />
              <div className="flex justify-between pt-2">
                <Skeleton className="h-4 w-20 bg-secondary" />
                <Skeleton className="h-6 w-16 bg-secondary" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <TargetTable
          targets={filteredTargets}
          onDelete={handleDelete}
          onRefresh={fetchTargets}
          searchFilter={search}
        />
      )}
    </div>
  );
}
