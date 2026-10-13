export interface Target {
  id: number;
  name: string;
  ip_address: string;
  port: number;
  os_type: string;
  environment: string;
  ssh_user: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TargetCreate {
  name: string;
  ip_address: string;
  port?: number;
  os_type?: string;
  environment?: string;
  ssh_user?: string;
  is_active?: boolean;
}

export interface TargetUpdate {
  name?: string;
  ip_address?: string;
  port?: number;
  os_type?: string;
  environment?: string;
  ssh_user?: string;
  is_active?: boolean;
}

export interface Alert {
  id: number;
  target_id: number;
  alert_name: string;
  severity: string;
  status: string;
  message: string | null;
  fired_at: string;
  resolved_at: string | null;
  created_at: string;
}

export interface MetricSnapshot {
  id: number;
  target_id: number;
  instance: string;
  cpu_usage_percent: number | null;
  memory_usage_percent: number | null;
  disk_usage_percent: number | null;
  load_1m: number | null;
  memory_total_bytes: number | null;
  memory_available_bytes: number | null;
  disk_total_bytes: number | null;
  disk_free_bytes: number | null;
  network_receive_rate: number | null;
  network_transmit_rate: number | null;
  recorded_at: string;
}

export interface MetricAggregation {
  target_id: number | null;
  avg_cpu: number | null;
  avg_memory: number | null;
  avg_disk: number | null;
  avg_load: number | null;
  min_recorded_at: string | null;
  max_recorded_at: string | null;
  sample_count: number;
}

export interface DiscoveryTarget {
  targets: string[];
  labels: {
    monitoring_name?: string;
    monitoring_os?: string;
    monitoring_env?: string;
    [key: string]: string | undefined;
  };
}
