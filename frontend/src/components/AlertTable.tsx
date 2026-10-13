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
      <div className="flex flex-col items-center justify-center rounded-[6px] border border-[#30363d] bg-[#161b22] p-10 text-center shadow-[0_1px_0_rgba(27,31,36,0.1)]">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#238636]/15 border border-[#3fb950]/30 text-[#3fb950] mb-3">
          <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
        </div>
        <h3 className="text-sm font-semibold text-[#f0f6fc]">No alert incidents recorded</h3>
        <p className="text-sm text-[#7d8590] mt-1 max-w-sm leading-[21px]">
          Webhook receiver queue is clear. No active alerts or threshold breaches recorded for current filter.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[6px] border border-[#30363d] bg-[#0d1117] overflow-hidden divide-y divide-[#21262d] shadow-[0_1px_0_rgba(27,31,36,0.1)]">
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
              className={`transition-colors ${
                isFiring ? 'bg-[#f85149]/5' : 'bg-[#0d1117]'
              }`}
            >
              {/* Card Header row */}
              <div 
                onClick={() => toggleExpand(alert.id)}
                className="flex items-center justify-between p-3.5 cursor-pointer hover:bg-[rgba(110,118,129,0.08)] transition-colors"
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
                  <span className="text-[#7d8590] hover:text-white transition-colors">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-[#4493f8]" aria-hidden="true" />
                    ) : (
                      <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    )}
                  </span>

                  <span className={`flex h-2.5 w-2.5 rounded-full shrink-0 ${
                    isFiring ? 'bg-[#f85149] ring-2 ring-[#f85149]/30' : 'bg-[#3fb950]'
                  }`} />

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-[#f0f6fc] font-mono">
                        {alert.alert_name}
                      </span>
                      <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#21262d] border border-[#30363d] text-[#7d8590]">
                        Target #{alert.target_id}
                      </span>
                    </div>
                    {alert.message && (
                      <p 
                        className="text-sm text-[#7d8590] break-words mt-0.5 leading-[21px] max-w-2xl"
                        title={alert.message}
                      >
                        {alert.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 ml-4">
                  <div className="hidden sm:flex flex-col items-end text-right font-mono text-xs">
                    <span className="text-xs text-[#7d8590] flex items-center gap-1">
                      <Clock className="h-3 w-3 opacity-60" aria-hidden="true" />
                      {formatDistanceToNow(new Date(alert.fired_at), { addSuffix: true })}
                    </span>
                    <span className="text-xs text-[#7d8590]/70">
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
                <div className="border-t border-[#21262d] bg-[#161b22] p-4 space-y-3 font-sans">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                    <div className="rounded-[6px] border border-[#30363d] bg-[#0d1117] p-2.5">
                      <span className="text-xs uppercase text-[#7d8590] font-semibold block">
                        Fired At Timestamp
                      </span>
                      <span className="tabular-nums text-sm font-mono text-[#f0f6fc] mt-0.5 block">
                        {format(new Date(alert.fired_at), 'yyyy-MM-dd HH:mm:ss OOO')}
                      </span>
                    </div>

                    <div className="rounded-[6px] border border-[#30363d] bg-[#0d1117] p-2.5">
                      <span className="text-xs uppercase text-[#7d8590] font-semibold block">
                        Resolution Status
                      </span>
                      <span className="text-sm font-mono text-[#f0f6fc] mt-0.5 block">
                        {alert.resolved_at 
                          ? format(new Date(alert.resolved_at), 'yyyy-MM-dd HH:mm:ss') 
                          : 'Currently Active (Unresolved)'}
                      </span>
                    </div>

                    <div className="rounded-[6px] border border-[#30363d] bg-[#0d1117] p-2.5">
                      <span className="text-xs uppercase text-[#7d8590] font-semibold block">
                        Target Association
                      </span>
                      <span className="text-sm font-mono text-[#f0f6fc] mt-0.5 block">
                        ID: {alert.target_id}
                      </span>
                    </div>
                  </div>

                  {alert.message && (
                    <div className="rounded-[6px] border border-[#30363d] bg-[#0d1117] p-3 text-sm">
                      <span className="text-xs uppercase text-[#7d8590] font-semibold block mb-1">
                        Incident Description & Annotations
                      </span>
                      <p className="text-[#f0f6fc] leading-[21px] break-words whitespace-pre-wrap select-all">
                        {alert.message}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-[#7d8590] flex items-center gap-1.5 font-mono">
                      <ShieldAlert className="h-4 w-4 text-[#4493f8]" aria-hidden="true" />
                      Alertmanager Event ID #{alert.id}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyPayload(alert);
                      }}
                      aria-label="Copy incident JSON payload"
                      className="flex items-center gap-1.5 h-8 px-3 py-[5px] rounded-[6px] text-xs font-medium bg-[#212830] hover:bg-[#30363d] text-[#f0f6fc] hover:text-white border border-[#30363d] transition-colors shadow-[rgba(61,68,77,0.7)_0px_-1px_0px_0px_inset]"
                    >
                      {isCopied ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-[#3fb950]" aria-hidden="true" />
                          <span className="text-[#3fb950]">Copied JSON</span>
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
