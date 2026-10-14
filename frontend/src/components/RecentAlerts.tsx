import { useState } from 'react';
import { Badge } from './ui/badge';
import type { Alert } from '../lib/types';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, ShieldCheck, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface RecentAlertsProps {
  alerts: Alert[];
}

export function RecentAlerts({ alerts }: RecentAlertsProps) {
  const [filter, setFilter] = useState<'all' | 'firing' | 'critical'>('all');

  const filteredAlerts = alerts
    .filter((a) => {
      if (filter === 'firing') return a.status === 'firing';
      if (filter === 'critical') return a.severity === 'critical';
      return true;
    })
    .slice(0, 6);

  const firingCount = alerts.filter(a => a.status === 'firing').length;

  return (
    <div className="rounded-[6px] border border-[#30363d] bg-[#161b22] shadow-[0_1px_0_rgba(27,31,36,0.1)] overflow-hidden">
      {/* Box Header with darker background to distinguish from content */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#30363d] bg-[#010409]">
        <div className="flex items-center gap-2.5">
            <div className={`flex h-7 w-7 items-center justify-center rounded-[6px] border ${
              firingCount > 0 
                ? 'bg-[#f85149]/15 border-[#f85149]/30 text-[#f85149]' 
                : 'bg-[#238636]/15 border-[#3fb950]/30 text-[#3fb950]'
            }`}>
              {firingCount > 0 ? <AlertCircle className="h-4 w-4" aria-hidden="true" /> : <ShieldCheck className="h-4 w-4" aria-hidden="true" />}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#f0f6fc]">
                Recent Alerts
              </h3>
              <p className="text-sm text-[#7d8590] leading-[21px]">
                Latest Alertmanager events
              </p>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center rounded-[6px] border border-[#30363d] bg-[#0d1117] p-0.5 text-xs" role="tablist" aria-label="Incident filters">
            <button
              type="button"
              role="tab"
              aria-selected={filter === 'all'}
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-[4px] text-xs transition-colors ${
                filter === 'all' ? 'bg-[#21262d] text-white font-medium' : 'text-[#7d8590] hover:text-white'
              }`}
            >
              All ({alerts.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={filter === 'firing'}
              onClick={() => setFilter('firing')}
              className={`px-2.5 py-1 rounded-[4px] text-xs transition-colors ${
                filter === 'firing' ? 'bg-[#f85149]/20 text-[#f85149] font-medium' : 'text-[#7d8590] hover:text-white'
              }`}
            >
              Firing ({firingCount})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={filter === 'critical'}
              onClick={() => setFilter('critical')}
              className={`px-2.5 py-1 rounded-[4px] text-xs transition-colors ${
                filter === 'critical' ? 'bg-[#d29922]/20 text-[#d29922] font-medium' : 'text-[#7d8590] hover:text-white'
              }`}
            >
              Critical
            </button>
          </div>
        </div>

        {/* Alerts List */}
        <div className="divide-y divide-[#21262d]">
          {filteredAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center bg-[#0d1117]">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#238636]/15 border border-[#3fb950]/30 text-[#3fb950] mb-2.5">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </div>
              <h4 className="text-xs font-semibold text-[#e6edf3]">All Clear</h4>
              <p className="text-[11px] text-[#848d97] mt-1 max-w-xs">
                No active alerts across monitored targets.
              </p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredAlerts.map((alert) => {
                const isFiring = alert.status === 'firing';
                return (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={`flex items-center justify-between p-3 transition-colors hover:bg-[rgba(110,118,129,0.08)] ${
                      isFiring ? 'bg-[#f85149]/5' : 'bg-[#0d1117]'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span className={`mt-1 flex h-2 w-2 rounded-full shrink-0 ${
                        isFiring ? 'bg-[#f85149] ring-2 ring-[#f85149]/30' : 'bg-[#3fb950]'
                      }`} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span 
                            className="text-sm font-semibold text-[#f0f6fc] font-mono break-words"
                            title={alert.alert_name}
                          >
                            {alert.alert_name}
                          </span>
                          <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#21262d] text-[#7d8590] border border-[#30363d] shrink-0">
                            Target #{alert.target_id}
                          </span>
                        </div>
                        {alert.message && (
                          <p 
                            className="text-sm text-[#7d8590] leading-[21px] break-words mt-0.5"
                            title={alert.message}
                          >
                            {alert.message}
                          </p>
                        )}
                        <span className="text-xs text-[#7d8590] block mt-0.5">
                          {formatDistanceToNow(new Date(alert.fired_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-3">
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
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>

        <div className="px-4 py-2.5 border-t border-[#30363d] bg-[#161b22] flex items-center justify-between">
        <span className="text-[#7d8590] text-sm">
          Showing {filteredAlerts.length} recent events
        </span>
        <Link
          to="/alerts"
          className="flex items-center gap-1 text-sm font-medium text-[#4493f8] hover:underline"
        >
          <span>View all history</span>
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
