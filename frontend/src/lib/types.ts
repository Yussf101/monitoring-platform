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
