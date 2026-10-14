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
    <div className="linear-monolith overflow-hidden">
      {/* Linear Header */}
      <div className="linear-header flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`flex h-7 w-7 items-center justify-center rounded-lg border ${firingCount > 0
              ? 'bg-[#f85149]/15 border-[#f85149]/30 text-[#f85149]'
              : 'bg-[#238636]/15 border-[#3fb950]/30 text-[#3fb950]'
            }`}>
            {firingCount > 0 ? <AlertCircle className="h-4 w-4" aria-hidden="true" /> : <ShieldCheck className="h-4 w-4" aria-hidden="true" />}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground dark:text-white tracking-tight">
              Recent Alerts
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5 leading-[18px]">
              Latest Alertmanager events
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center rounded-lg border border-white/10 dark:border-white/10 border-slate-200 bg-black/40 dark:bg-black/40 bg-slate-100 p-0.5 text-xs" role="tablist" aria-label="Incident filters">
          <button
            type="button"
            role="tab"
            aria-selected={filter === 'all'}
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1 rounded-md text-xs transition-colors ${filter === 'all' ? 'bg-[#e5484d] text-white font-medium shadow-[0_0_10px_rgba(229,72,77,0.35)]' : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            All ({alerts.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filter === 'firing'}
            onClick={() => setFilter('firing')}
            className={`px-2.5 py-1 rounded-md text-xs transition-colors ${filter === 'firing' ? 'bg-[#e5484d]/20 text-[#e5484d] font-medium border border-[#e5484d]/40 shadow-[0_0_8px_rgba(229,72,77,0.25)]' : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            Firing ({firingCount})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filter === 'critical'}
            onClick={() => setFilter('critical')}
            className={`px-2.5 py-1 rounded-md text-xs transition-colors ${filter === 'critical' ? 'bg-[#d29922]/20 text-[#d29922] font-medium' : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            Critical
          </button>
        </div>
      </div>

      {/* Alerts List */}
      <div>
        {filteredAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#238636]/15 border border-[#3fb950]/30 text-[#3fb950] mb-2.5">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <h4 className="text-xs font-semibold text-foreground">All Clear</h4>
            <p className="text-[11px] text-muted-foreground mt-1 max-w-xs">
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
                  className={`linear-row flex items-center justify-between p-3.5 transition-colors ${isFiring ? 'bg-[#e5484d]/5' : ''
                    }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span className={`mt-1.5 flex h-2 w-2 rounded-full shrink-0 ${isFiring ? 'bg-[#e5484d] ring-2 ring-[#e5484d]/40 shadow-[0_0_8px_rgba(229,72,77,0.5)]' : 'bg-[#3fb950]'
                      }`} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="text-sm font-semibold text-foreground dark:text-white font-mono break-words"
                          title={alert.alert_name}
                        >
                          {alert.alert_name}
                        </span>
                        <span className="linear-pill shrink-0">
                          #{alert.target_id}
                        </span>
                      </div>
                      {alert.message && (
                        <p
                          className="text-sm text-muted-foreground leading-[21px] break-words mt-0.5"
                          title={alert.message}
                        >
                          {alert.message}
                        </p>
                      )}
                      <span className="text-xs text-muted-foreground block mt-0.5">
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

      <div className="linear-footer flex items-center justify-between">
        <span className="text-muted-foreground text-xs font-mono">
          Showing {filteredAlerts.length} events
        </span>
        <Link
          to="/alerts"
          className="flex items-center gap-1 text-xs font-medium text-[#8b95f6] hover:text-[#a5b4fc] hover:underline"
        >
          <span>View all history</span>
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
