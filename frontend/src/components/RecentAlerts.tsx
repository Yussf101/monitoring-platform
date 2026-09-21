import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import type { Alert } from '../lib/types';
import { formatDistanceToNow } from 'date-fns';

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
            {recentAlerts.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
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
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
