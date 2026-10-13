import type { 
  Target, 
  TargetCreate, 
  TargetUpdate, 
  Alert, 
  MetricSnapshot, 
  MetricAggregation, 
  DiscoveryTarget 
} from './types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    let errorMessage = `API Error: ${response.status} ${response.statusText}`;
    if (typeof errorData.detail === 'string') {
      errorMessage = errorData.detail;
    } else if (Array.isArray(errorData.detail)) {
      errorMessage = errorData.detail.map((e: any) => `${e.loc?.join('.') || 'Field'} - ${e.msg}`).join(', ');
    }
    throw new Error(errorMessage);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

// Target Endpoints
export async function getTargets(): Promise<Target[]> {
  return apiFetch<Target[]>('/api/targets/');
}

export async function getTarget(id: number): Promise<Target> {
  return apiFetch<Target>(`/api/targets/${id}`);
}

export async function createTarget(data: TargetCreate): Promise<Target> {
  return apiFetch<Target>('/api/targets/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateTarget(id: number, data: TargetUpdate): Promise<Target> {
  return apiFetch<Target>(`/api/targets/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteTarget(id: number): Promise<void> {
  return apiFetch<void>(`/api/targets/${id}`, {
    method: 'DELETE',
  });
}

// Alert Endpoints
export async function getAlerts(limit: number = 100, offset: number = 0): Promise<Alert[]> {
  return apiFetch<Alert[]>(`/api/alerts/?limit=${limit}&offset=${offset}`);
}

export async function getAlertsByTarget(targetId: number): Promise<Alert[]> {
  return apiFetch<Alert[]>(`/api/alerts/target/${targetId}`);
}

// Metric Endpoints
export async function getLatestMetrics(targetId?: number): Promise<MetricSnapshot[]> {
  const query = targetId !== undefined ? `?target_id=${targetId}` : '';
  return apiFetch<MetricSnapshot[]>(`/api/metrics/latest${query}`);
}

export async function getMetricHistory(
  targetId: number,
  hours: number = 24,
  limit: number = 500
): Promise<MetricSnapshot[]> {
  return apiFetch<MetricSnapshot[]>(`/api/metrics/history/${targetId}?hours=${hours}&limit=${limit}`);
}

export async function getMetricSummary(targetId?: number, hours: number = 1): Promise<MetricAggregation[]> {
  const query = new URLSearchParams();
  if (targetId !== undefined) query.set('target_id', targetId.toString());
  query.set('hours', hours.toString());
  return apiFetch<MetricAggregation[]>(`/api/metrics/summary?${query.toString()}`);
}

// Discovery Endpoints
export async function getDiscoveryTargets(): Promise<DiscoveryTarget[]> {
  return apiFetch<DiscoveryTarget[]>('/api/discovery');
}

// Health Check
export async function getHealth(): Promise<{ status: string; service: string }> {
  return apiFetch<{ status: string; service: string }>('/');
}
