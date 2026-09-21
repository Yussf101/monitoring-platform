import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import type { Alert } from '../lib/types';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

interface RecentAlertsProps {
  alerts: Alert[];
}

export function RecentAlerts({ alerts }: RecentAlertsProps) {
  // Take only the top 5 most recent alerts
  const recentAlerts = alerts.slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Alerts</CardTitle>
      </CardHeader>
      <CardContent>
        {recentAlerts.length === 0 ? (
          <div className="text-sm text-muted-foreground py-4 text-center">
            No recent alerts.
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
            {recentAlerts.map((alert, index) => (
              <motion.div 
                key={alert.id} 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.1 }}
                className="group flex items-center justify-between border-b pb-4 last:border-0 last:pb-0 transition-colors hover:bg-muted/20 p-2 -mx-2 rounded-lg"
              >
                <div className="flex flex-col space-y-1">
                  <span className="text-sm font-medium">{alert.alert_name}</span>
                  <span className="text-xs text-muted-foreground">
                    Target #{alert.target_id} • {formatDistanceToNow(new Date(alert.fired_at), { addSuffix: true })}
                  </span>
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
        )}
      </CardContent>
    </Card>
  );
}
