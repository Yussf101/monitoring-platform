import { useEffect, useState } from 'react';
import { getTargets, getAlerts } from '../lib/api';
import type { Target, Alert } from '../lib/types';
import { StatCard } from '../components/StatCard';
import { RecentAlerts } from '../components/RecentAlerts';
import { Activity, Server, AlertTriangle } from 'lucide-react';

export function DashboardPage() {
  const [targets, setTargets] = useState<Target[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      // getAlerts limits to 100 by default, which is fine for the dashboard
      const [fetchedTargets, fetchedAlerts] = await Promise.all([
        getTargets(),
        getAlerts()
      ]);
      setTargets(fetchedTargets);
      setAlerts(fetchedAlerts);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // 30s auto-refresh
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-muted-foreground animate-pulse">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-destructive/10 text-destructive rounded-md">
        {error}
      </div>
    );
  }

  const activeTargetsCount = targets.filter(t => t.is_active).length;
  const firingAlertsCount = alerts.filter(a => a.status === 'firing').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Overview of your monitoring platform
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Targets"
          value={targets.length}
          icon={Server}
          description="Monitored endpoints"
        />
        <StatCard
          title="Active Targets"
          value={activeTargetsCount}
          icon={Activity}
          description={`${targets.length - activeTargetsCount} inactive`}
        />
        <StatCard
          title="Firing Alerts"
          value={firingAlertsCount}
          icon={AlertTriangle}
          description="Active incidents"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentAlerts alerts={alerts} />
        {/* Placeholder for future widgets, e.g., CPU load charts */}
      </div>
    </div>
  );
}
