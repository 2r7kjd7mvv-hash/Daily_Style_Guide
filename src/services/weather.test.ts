import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./runtimeConfig', () => ({ getApiBaseUrl: () => 'https://worker.example' }));
import { getTripForecast } from './weather';

const request = {
  workflow_id: '7680787686953058346' as const,
  parameters: {
    city: '巴黎', province: '法兰西岛', towns: '巴黎', villages: '巴黎',
    start_time: '2026.9.20', end_time: '2026.9.20',
  },
};

describe('getTripForecast', () => {
  beforeEach(() => vi.unstubAllGlobals());

  it('posts the workflow request to the public forecast endpoint', async () => {
    const forecast = [{ date: '2026-09-20', weather: '晴', uv_index: 4.2 }];
    const fetcher = vi.fn(async () => Response.json(forecast));
    vi.stubGlobal('fetch', fetcher);

    await expect(getTripForecast(request)).resolves.toEqual(forecast);
    expect(fetcher).toHaveBeenCalledWith('https://worker.example/api/weather/forecast', expect.objectContaining({
      method: 'POST', body: JSON.stringify(request),
    }));
  });
});
