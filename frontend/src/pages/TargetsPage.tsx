import { useEffect, useState, useCallback, useRef } from "react";
import { getTargets, deleteTarget } from "../lib/api";
import type { Target } from "../lib/types";
import { TargetTable } from "../components/TargetTable";
import { AddTargetModal } from "../components/AddTargetModal";
import { Skeleton } from "../components/ui/skeleton";
import { Search, Filter, RefreshCw } from "lucide-react";
import { Badge } from "../components/ui/badge";

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#30363d]">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#f0f6fc]">
              Monitored Nodes & Endpoints
            </h2>
            <Badge variant="secondary" className="font-mono tabular-nums text-xs">
              {targets.length} Nodes
            </Badge>
          </div>
          <p className="text-sm text-[#7d8590] mt-1 leading-[21px]">
            Daemon endpoints and scrape configurations queried by the Prometheus polling worker.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchTargets}
            disabled={isLoading}
            aria-label="Refresh target list"
            className="flex items-center gap-1.5 h-8 px-3 py-[5px] rounded-[6px] border border-[#30363d] bg-[#212830] hover:bg-[#30363d] hover:border-[#8b949e] text-sm font-medium text-[#f0f6fc] hover:text-white transition-colors disabled:opacity-50 shadow-[rgba(61,68,77,0.7)_0px_-1px_0px_0px_inset]"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-[#4493f8]' : ''}`} aria-hidden="true" />
            <span>Refresh</span>
          </button>
          <AddTargetModal onSuccess={fetchTargets} />
        </div>
      </div>
      
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-[6px] border border-[#30363d] bg-[#161b22] p-2.5 shadow-[0_1px_0_rgba(27,31,36,0.1)]">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7d8590]" aria-hidden="true" />
          <input
            ref={searchInputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter target inventory by host, subnet, or tags..."
            aria-label="Filter target inventory"
            className="h-8 w-full rounded-[6px] border border-[#30363d] bg-[#0d1117] pl-8 pr-8 text-sm leading-[20px] text-[#f0f6fc] placeholder:text-[#7d8590] focus:border-[#4493f8] focus:outline-none focus:ring-1 focus:ring-[#4493f8] transition-colors"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear filter text"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#848d97] hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* Status and Environment Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-[6px] border border-[#30363d] bg-[#21262d] p-0.5 text-xs" role="tablist" aria-label="Status filter">
            <button
              type="button"
              role="tab"
              aria-selected={statusFilter === "all"}
              onClick={() => setStatusFilter("all")}
              className={`px-2.5 py-1 rounded-[4px] text-xs font-medium transition-colors ${
                statusFilter === "all" ? "bg-[#30363d] text-white font-semibold" : "text-[#848d97] hover:text-white"
              }`}
            >
              All ({targets.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={statusFilter === "active"}
              onClick={() => setStatusFilter("active")}
              className={`px-2.5 py-1 rounded-[4px] text-xs font-medium transition-colors ${
                statusFilter === "active" ? "bg-[#238636]/20 text-[#3fb950] font-semibold" : "text-[#848d97] hover:text-white"
              }`}
            >
              Active ({activeCount})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={statusFilter === "inactive"}
              onClick={() => setStatusFilter("inactive")}
              className={`px-2.5 py-1 rounded-[4px] text-xs font-medium transition-colors ${
                statusFilter === "inactive" ? "bg-[#30363d] text-white font-semibold" : "text-[#848d97] hover:text-white"
              }`}
            >
              Muted ({targets.length - activeCount})
            </button>
          </div>

          {environments.length > 0 && (
            <div className="flex items-center gap-1.5 rounded-[6px] border border-[#30363d] bg-[#0d1117] px-2.5 py-1 text-xs">
              <Filter className="h-3.5 w-3.5 text-[#848d97]" aria-hidden="true" />
              <select
                value={envFilter}
                onChange={(e) => setEnvFilter(e.target.value)}
                aria-label="Filter by environment tier"
                className="bg-transparent text-xs text-[#c9d1d9] hover:text-white focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-[#161b22]">All Envs</option>
                {environments.map((env) => (
                  <option key={env} value={env} className="bg-[#161b22]">
                    {env}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-[6px] border border-[#f85149]/40 bg-[#f85149]/10 p-3 text-xs font-medium text-[#f85149]">
          {error}
        </div>
      )}

      {/* Target Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-[6px] border border-[#30363d] bg-[#161b22] p-4 space-y-3">
              <div className="flex justify-between">
                <Skeleton className="h-5 w-32 bg-[#21262d]" />
                <Skeleton className="h-4 w-12 bg-[#21262d]" />
              </div>
              <Skeleton className="h-8 w-full bg-[#21262d]" />
              <div className="flex justify-between pt-2">
                <Skeleton className="h-4 w-20 bg-[#21262d]" />
                <Skeleton className="h-6 w-16 bg-[#21262d]" />
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
