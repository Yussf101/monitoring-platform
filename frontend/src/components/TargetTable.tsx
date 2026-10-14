import { useState } from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Trash2,
  BarChart2,
  Copy,
  Check,
  LayoutGrid,
  List,
  Terminal,
  AlertTriangle,
  Server
} from "lucide-react";
import type { Target } from "../lib/types";
import { motion, AnimatePresence } from "framer-motion";
import { EditTargetModal } from "./EditTargetModal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

interface TargetTableProps {
  targets: Target[];
  onDelete: (id: number) => void;
  onRefresh?: () => void;
  searchFilter?: string;
}

export function TargetTable({ targets, onDelete, onRefresh = () => { }, searchFilter = '' }: TargetTableProps) {
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<Target | null>(null);

  const handleCopy = (id: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredTargets = targets.filter((target) => {
    if (!searchFilter) return true;
    const q = searchFilter.toLowerCase();
    return (
      target.name.toLowerCase().includes(q) ||
      target.ip_address.toLowerCase().includes(q) ||
      target.environment?.toLowerCase().includes(q) ||
      target.os_type?.toLowerCase().includes(q)
    );
  });

  if (targets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[6px] border border-border bg-card p-10 text-center shadow-[0_1px_0_rgba(27,31,36,0.1)]">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary border border-border text-muted-foreground mb-3">
          <Server className="h-5 w-5" aria-hidden="true" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">No targets found</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm leading-[21px]">
          Add a target to start broadcasting it to Prometheus HTTP service discovery.
        </p>
      </div>
    );
  }

  if (filteredTargets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[6px] border border-border bg-card p-8 text-center shadow-[0_1px_0_rgba(27,31,36,0.1)]">
        <p className="text-sm font-semibold text-foreground">No targets match "{searchFilter}"</p>
        <p className="text-xs text-muted-foreground mt-1">Try refining your search keyword or clearing the filter.</p>
      </div>
    );
  }

  const getEnvBadgeVariant = (env?: string) => {
    switch (env?.toLowerCase()) {
      case 'production':
        return 'destructive';
      case 'staging':
        return 'warning';
      case 'development':
      case 'dev':
        return 'info';
      default:
        return 'secondary';
    }
  };

  const getHealthBadge = (target: Target) => {
    if (!target.is_active || target.health === "muted") {
      return {
        variant: "outline" as const,
        dotColor: "bg-[#6e7681]",
        text: "MUTED",
        description: "Target scraping is disabled",
      };
    }
    if (target.health === "up") {
      return {
        variant: "success" as const,
        dotColor: "bg-[#3fb950]",
        text: "UP",
        description: "Node exporter responding nominal",
      };
    }
    if (target.health === "down") {
      return {
        variant: "destructive" as const,
        dotColor: "bg-[#e5484d] shadow-[0_0_6px_rgba(229,72,77,0.6)]",
        text: "DOWN",
        description: target.last_error || "Target is unreachable or powered off",
      };
    }
    return {
      variant: "outline" as const,
      dotColor: "bg-[#d29922]",
      text: "UNKNOWN",
      description: "Scrape status not yet recorded",
    };
  };

  return (
    <div className="linear-monolith overflow-hidden">
      {/* Linear Command Header */}
      <div className="linear-header flex items-center justify-between">
        <div className="flex items-center gap-2.5 text-sm">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#5e6ad2]/20 border border-[#5e6ad2]/30 text-[#8b9bf7]">
            <Server className="h-3.5 w-3.5" aria-hidden="true" />
          </div>
          <span className="text-[17px] font-semibold text-foreground dark:text-white tracking-tight">Endpoints</span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.06] border border-border dark:border-white/10 text-muted-foreground dark:text-neutral-300">
            {filteredTargets.length} / {targets.length}
          </span>
        </div>

        <div className="flex items-center rounded-lg border border-border dark:border-white/10 bg-slate-100 dark:bg-black/40 p-0.5 text-xs" role="group" aria-label="View mode">
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            aria-pressed={viewMode === "grid"}
            aria-label="Switch to Card Grid View"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${viewMode === "grid"
                ? "bg-[#5e6ad2] text-white font-medium shadow-xs"
                : "text-neutral-400 hover:text-white"
              }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Cards</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("table")}
            aria-pressed={viewMode === "table"}
            aria-label="Switch to Tabular View"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${viewMode === "table"
                ? "bg-[#5e6ad2] text-white font-medium shadow-xs"
                : "text-neutral-400 hover:text-white"
              }`}
          >
            <List className="h-3.5 w-3.5" aria-hidden="true" />
            <span>List</span>
          </button>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === "grid" && (
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <AnimatePresence mode="popLayout">
            {filteredTargets.map((target) => {
              const port = target.port || 9100;
              const isCopied = copiedId === target.id;
              const grafanaUrl = `http://localhost:3001/d/Main-Dashboard?var-instance=${target.ip_address}:${port}`;

              return (
                <motion.div
                  key={target.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col justify-between p-4 rounded-xl border border-border dark:border-white/[0.08] bg-card dark:bg-[#14171d] hover:border-[#5e6ad2]/50 hover:bg-slate-50 dark:hover:bg-[#181b22] transition-all duration-150 shadow-xs"
                >
                  {/* Top Bar */}
                  <div>
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-secondary border border-border text-muted-foreground shrink-0">
                          <Terminal className="h-4 w-4" aria-hidden="true" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="linear-pill shrink-0">#{target.id}</span>
                            <h4
                              className="text-sm font-semibold text-foreground truncate"
                              title={target.name}
                            >
                              {target.name}
                            </h4>
                          </div>
                          <span className="text-xs font-mono text-muted-foreground uppercase mt-0.5 block">
                            {target.os_type || 'Linux'}
                          </span>
                        </div>
                      </div>

                      {(() => {
                        const health = getHealthBadge(target);
                        return (
                          <Badge variant={health.variant} className="shrink-0 gap-1 text-xs" title={health.description}>
                            <span className={`h-1.5 w-1.5 rounded-full ${health.dotColor}`} />
                            {health.text}
                          </Badge>
                        );
                      })()}
                    </div>

                    {/* IP & Port */}
                    <div className="mt-3 rounded-[6px] border border-border bg-secondary dark:bg-black/30 p-2 flex items-center justify-between">
                      <span
                        className="font-mono tabular-nums text-sm text-foreground break-all"
                        title={`${target.ip_address}:${port}`}
                      >
                        {target.ip_address}:{port}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(target.id, `${target.ip_address}:${port}`)}
                        className="flex h-6 w-6 items-center justify-center rounded-[4px] text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shrink-0"
                        aria-label={`Copy endpoint address for ${target.name}`}
                        title="Copy endpoint address"
                      >
                        {isCopied ? <Check className="h-3.5 w-3.5 text-[#3fb950]" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
                      </button>
                    </div>

                    {/* Offline / Down Warning Banner */}
                    {target.health === "down" && target.last_error && (
                      <div
                        className="mt-2 rounded-[4px] bg-[rgba(229,72,77,0.1)] border border-[rgba(229,72,77,0.25)] px-2.5 py-1.5 text-xs text-[#e5484d] flex items-start gap-1.5"
                        title={target.last_error}
                      >
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-[#e5484d]" aria-hidden="true" />
                        <span className="truncate font-mono text-[11px] leading-tight">
                          {target.last_error.includes("context deadline exceeded")
                            ? "Connection timed out (machine off)"
                            : target.last_error.includes("connection refused")
                              ? "Port refused (exporter down)"
                              : target.last_error}
                        </span>
                      </div>
                    )}

                    {/* Metadata tags */}
                    <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
                      <Badge variant={getEnvBadgeVariant(target.environment)}>
                        {target.environment || "production"}
                      </Badge>
                      {target.ssh_user && (
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-mono text-muted-foreground border border-border">
                          user: {target.ssh_user}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
                    <a
                      href={grafanaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Inspect Node in Grafana"
                      aria-label={`Inspect ${target.name} metrics in Grafana`}
                      className="flex items-center gap-1.5 text-sm font-medium text-[#4493f8] hover:underline"
                    >
                      <BarChart2 className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Grafana</span>
                    </a>

                    <div className="flex items-center gap-1.5">
                      <EditTargetModal target={target} onSuccess={onRefresh} />
                      <button
                        type="button"
                        onClick={() => setDeleteTargetId(target)}
                        title="Delete target"
                        aria-label={`Delete monitored target ${target.name}`}
                        className="flex h-7 w-7 items-center justify-center rounded-[6px] border border-border bg-secondary text-muted-foreground hover:bg-[#da3633] hover:border-[#da3633] hover:text-white transition-colors shadow-[0_1px_0_rgba(27,31,36,0.1)]"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Table View */}
      {viewMode === "table" && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm" aria-label="Registered Monitored Targets">
            <thead className="border-b border-border dark:border-white/[0.06] bg-slate-100 dark:bg-[#14171d] text-muted-foreground uppercase text-[11px] font-mono tracking-wider font-medium">
              <tr>
                <th scope="col" className="py-3 px-4">Target Node</th>
                <th scope="col" className="py-3 px-4">Endpoint (IP:Port)</th>
                <th scope="col" className="py-3 px-4">Environment</th>
                <th scope="col" className="py-3 px-4">Platform</th>
                <th scope="col" className="py-3 px-4">Status</th>
                <th scope="col" className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border dark:divide-white/[0.04]">
              {filteredTargets.map((target) => {
                const port = target.port || 9100;
                const isCopied = copiedId === target.id;
                const grafanaUrl = `http://localhost:3001/d/Main-Dashboard?var-instance=${target.ip_address}:${port}`;

                return (
                  <tr key={target.id} className="linear-row hover:bg-white/[0.04] transition-colors group">
                    <td className="py-3 px-4 font-medium text-foreground">
                      <div className="flex items-center gap-2.5">
                        <span className="text-[11px] font-mono text-[#5e6ad2] bg-[#5e6ad2]/10 px-1.5 py-0.5 rounded border border-[#5e6ad2]/20">
                          #{target.id}
                        </span>
                        <span className="font-mono text-sm font-semibold">{target.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-muted-foreground text-sm">
                      <div className="flex items-center gap-2">
                        <span>{target.ip_address}:{port}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(target.id, `${target.ip_address}:${port}`)}
                          className="text-[#6e7681] hover:text-foreground opacity-60 group-hover:opacity-100 transition-opacity"
                          aria-label={`Copy address for ${target.name}`}
                        >
                          {isCopied ? <Check className="h-3.5 w-3.5 text-[#3fb950]" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#5e6ad2]/15 text-[#8b9bf7] border border-[#5e6ad2]/25 font-medium">
                        {target.environment || "production"}
                      </span>
                    </td>
                    <td className="py-3 px-4 uppercase text-neutral-400 font-mono text-xs">
                      {target.os_type || 'linux'}
                    </td>
                    <td className="py-3 px-4">
                      {(() => {
                        const health = getHealthBadge(target);
                        return (
                          <div className="flex flex-col gap-0.5">
                            <Badge variant={health.variant} className="gap-1 w-fit text-xs" title={health.description}>
                              <span className={`h-1.5 w-1.5 rounded-full ${health.dotColor}`} />
                              {health.text}
                            </Badge>
                            {target.health === "down" && target.last_error && (
                              <span
                                className="text-[11px] text-[#e5484d] font-mono truncate max-w-[180px]"
                                title={target.last_error}
                              >
                                {target.last_error.includes("context deadline exceeded")
                                  ? "Timeout (offline)"
                                  : "Unreachable"}
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={grafanaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Open in Grafana"
                          aria-label={`Inspect ${target.name} in Grafana`}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-border dark:border-white/10 bg-secondary dark:bg-white/[0.04] hover:bg-[#5e6ad2]/20 hover:border-[#5e6ad2]/40 text-muted-foreground hover:text-foreground dark:text-neutral-300 dark:hover:text-white transition-colors"
                        >
                          <BarChart2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </a>
                        <EditTargetModal target={target} onSuccess={onRefresh} />
                        <button
                          type="button"
                          onClick={() => setDeleteTargetId(target)}
                          title="Delete target"
                          aria-label={`Delete ${target.name}`}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-border dark:border-white/10 bg-secondary dark:bg-white/[0.04] hover:bg-[#da3633] hover:border-[#da3633] text-muted-foreground hover:text-white transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Linear Monolith Footer */}
      <div className="linear-footer flex items-center justify-between text-xs text-muted-foreground font-mono">
        <span className="flex items-center gap-2">
        </span>
        <span className="text-foreground dark:text-neutral-300 font-semibold">
          {filteredTargets.filter(t => t.is_active).length} Active Nodes
        </span>
      </div>

      {/* Delete Confirmation Barrier Dialog */}
      <Dialog open={deleteTargetId !== null} onOpenChange={(open) => !open && setDeleteTargetId(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <div className="flex items-center gap-2 text-[#e5484d]">
              <AlertTriangle className="h-5 w-5 text-[#e5484d]" aria-hidden="true" />
              <DialogTitle className="text-sm font-semibold text-foreground">Confirm Target Deletion</DialogTitle>
            </div>
            <p className="text-xs text-muted-foreground pt-2 leading-relaxed">
              Are you sure you want to delete <span className="font-semibold text-foreground font-mono">{deleteTargetId?.name}</span> (<span className="font-mono text-foreground">{deleteTargetId?.ip_address}</span>)?
              Prometheus HTTP service discovery will immediately remove this instance and cease polling metrics.
            </p>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeleteTargetId(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => {
                if (deleteTargetId) {
                  onDelete(deleteTargetId.id);
                  setDeleteTargetId(null);
                }
              }}
            >
              Delete Target
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
