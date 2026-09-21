import { Badge } from "./ui/badge";
import type { Alert } from "../lib/types";
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

interface AlertTableProps {
  alerts: Alert[];
}

export function AlertTable({ alerts }: AlertTableProps) {
  if (alerts.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-4 text-center">
        No alerts found.
      </div>
    );
  }

  return (
    <div className="space-y-4 bg-card border p-4">
      <AnimatePresence mode="popLayout">
        {alerts.map((alert, index) => (
          <motion.div 
            key={alert.id} 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ delay: index * 0.05 }}
            className="group flex items-center justify-between border-b pb-4 pt-2 last:border-0 last:pb-0 transition-colors hover:bg-muted/20 px-4 -mx-4 rounded-none"
          >
            <div className="flex flex-col space-y-1">
              <span className="text-sm font-medium">{alert.alert_name}</span>
              <span className="text-xs text-muted-foreground">
                Target #{alert.target_id} • {formatDistanceToNow(new Date(alert.fired_at), { addSuffix: true })}
              </span>
              {alert.message && (
                <span className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  {alert.message}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={alert.status === 'firing' ? 'destructive' : 'outline'} className={alert.status === 'firing' ? 'animate-pulse' : ''}>
                {alert.status.toUpperCase()}
              </Badge>
              <Badge variant="secondary">
                {alert.severity}
              </Badge>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
