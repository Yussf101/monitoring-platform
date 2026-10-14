import { useState } from "react";
import { Badge } from "./ui/badge";
import type { Alert } from "../lib/types";
import { formatDistanceToNow, format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  ChevronDown, 
  ChevronRight, 
  Check, 
  Clock, 
  ShieldAlert, 
  Code 
} from "lucide-react";

interface AlertTableProps {
  alerts: Alert[];
}

export function AlertTable({ alerts }: AlertTableProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const toggleExpand = (id: number) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  const handleCopyPayload = (alert: Alert) => {
    navigator.clipboard.writeText(JSON.stringify(alert, null, 2));
    setCopiedId(alert.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[6px] border border-border bg-card p-10 text-center shadow-sm">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 dark:text-emerald-400 mb-3">
          <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">No alert incidents recorded</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm leading-[21px]">
          Webhook receiver queue is clear. No active alerts or threshold breaches recorded for current filter.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <AnimatePresence mode="popLayout">
        {alerts.map((alert) => {
          const isFiring = alert.status === 'firing';
          const isExpanded = expandedId === alert.id;
          const isCopied = copiedId === alert.id;

          return (
            <motion.div 
              key={alert.id} 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="linear-monolith overflow-hidden transition-all duration-150"
            >
              {/* Card Header row */}
              <div 
                onClick={() => toggleExpand(alert.id)}
                className="linear-row flex items-center justify-between p-3.5 cursor-pointer"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleExpand(alert.id);
                  }
                }}
                aria-expanded={isExpanded}
                aria-label={`Toggle details for alert ${alert.alert_name}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-muted-foreground hover:text-foreground transition-colors">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-[#8b95f6]" aria-hidden="true" />
                    ) : (
                      <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    )}
                  </span>

                  <span className={`flex h-2.5 w-2.5 rounded-full shrink-0 ${
                    isFiring ? 'bg-rose-500 ring-2 ring-rose-500/30' : 'bg-emerald-500'
                  }`} />

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-foreground font-mono">
                        {alert.alert_name}
                      </span>
                      <span className="linear-pill shrink-0">
                        #{alert.target_id}
                      </span>
                    </div>
                    {alert.message && (
                      <p 
                        className="text-sm text-muted-foreground break-words mt-0.5 leading-[21px] max-w-2xl"
                        title={alert.message}
                      >
                        {alert.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 ml-4">
                  <div className="hidden sm:flex flex-col items-end text-right font-mono text-xs">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3 opacity-60" aria-hidden="true" />
                      {formatDistanceToNow(new Date(alert.fired_at), { addSuffix: true })}
                    </span>
                    <span className="text-xs text-muted-foreground/70">
                      {format(new Date(alert.fired_at), 'HH:mm:ss')}
                    </span>
                  </div>

                  <Badge variant={isFiring ? 'destructive' : 'success'}>
                    {alert.status.toUpperCase()}
                  </Badge>

                  <Badge 
                    variant={
                      alert.severity === 'critical' 
                        ? 'destructive' 
                        : alert.severity === 'warning' 
                        ? 'warning' 
                        : 'info'
                    }
                  >
                    {alert.severity}
                  </Badge>
                </div>
              </div>

              {/* Expandable Drawer */}
              {isExpanded && (
                <div className="border-t border-white/[0.06] dark:border-white/[0.06] border-slate-200 bg-[#0c0e12] dark:bg-[#0c0e12] bg-slate-50 p-4 space-y-3 font-sans">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
                    <div className="rounded-lg border border-white/[0.06] dark:border-white/[0.06] border-slate-200 bg-[#14171d] dark:bg-[#14171d] bg-white p-3">
                      <span className="text-xs uppercase text-muted-foreground font-semibold block font-mono">
                        Fired At Timestamp
                      </span>
                      <span className="tabular-nums text-sm font-mono text-foreground mt-1 block">
                        {format(new Date(alert.fired_at), 'yyyy-MM-dd HH:mm:ss OOO')}
                      </span>
                    </div>

                    <div className="rounded-lg border border-white/[0.06] dark:border-white/[0.06] border-slate-200 bg-[#14171d] dark:bg-[#14171d] bg-white p-3">
                      <span className="text-xs uppercase text-muted-foreground font-semibold block font-mono">
                        Resolution Status
                      </span>
                      <span className="text-sm font-mono text-foreground mt-1 block">
                        {alert.resolved_at 
                          ? format(new Date(alert.resolved_at), 'yyyy-MM-dd HH:mm:ss') 
                          : 'Currently Active (Unresolved)'}
                      </span>
                    </div>

                    <div className="rounded-lg border border-white/[0.06] dark:border-white/[0.06] border-slate-200 bg-[#14171d] dark:bg-[#14171d] bg-white p-3">
                      <span className="text-xs uppercase text-muted-foreground font-semibold block font-mono">
                        Target Association
                      </span>
                      <span className="text-sm font-mono text-foreground mt-1 block">
                        Target ID: #{alert.target_id}
                      </span>
                    </div>
                  </div>

                  {alert.message && (
                    <div className="rounded-lg border border-white/[0.06] dark:border-white/[0.06] border-slate-200 bg-[#14171d] dark:bg-[#14171d] bg-white p-3.5 text-sm">
                      <span className="text-xs uppercase text-muted-foreground font-semibold block mb-1 font-mono">
                        Incident Description & Annotations
                      </span>
                      <p className="text-foreground leading-[21px] break-words whitespace-pre-wrap select-all">
                        {alert.message}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5 font-mono">
                      <ShieldAlert className="h-4 w-4 text-[#8b95f6]" aria-hidden="true" />
                      Alertmanager Event ID #{alert.id}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyPayload(alert);
                      }}
                      aria-label="Copy incident JSON payload"
                      className="flex items-center gap-1.5 h-8 px-3 py-[5px] rounded-lg text-xs font-medium bg-white/[0.05] dark:bg-white/[0.05] bg-white hover:bg-white/[0.1] text-foreground border border-white/10 dark:border-white/10 border-slate-200 transition-colors shadow-xs"
                    >
                      {isCopied ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" aria-hidden="true" />
                          <span className="text-emerald-500 dark:text-emerald-400">Copied JSON</span>
                        </>
                      ) : (
                        <>
                          <Code className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Copy Payload</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
