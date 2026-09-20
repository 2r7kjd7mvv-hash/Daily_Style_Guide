import type { TripForecastDay, WorkflowGenerateRequest } from '@/types';
import { getApiBaseUrl } from './runtimeConfig';

export async function getTripForecast(request: WorkflowGenerateRequest): Promise<TripForecastDay[]> {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) return [];
  const response = await fetch(`${baseUrl}/api/weather/forecast`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!response.ok) throw new Error('天气服务暂不可用');
  const payload = await response.json();
  return Array.isArray(payload) ? payload as TripForecastDay[] : [];
}
