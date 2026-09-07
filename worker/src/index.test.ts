import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import worker, { handleRequest } from './index';

const origin = 'https://2r7kjd7mvv-hash.github.io';

function createGenerateFetcher(onCoze?: (init?: RequestInit) => void) {
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(input.toString());
    if (url.hostname === 'nominatim.openstreetmap.org') {
      return Response.json([{ lat: '48.8566', lon: '2.3522' }]);
    }
    if (url.hostname === 'api.open-meteo.com') {
      return Response.json({
        latitude: 48.86,
        longitude: 2.35,
        timezone: 'Europe/Paris',
        daily: {
          time: ['2026-09-05', '2026-09-06'],
          weather_code: [0, 2],
          temperature_2m_min: [12, 13],
          temperature_2m_max: [24, 23],
          precipitation_probability_max: [5, 20],
        },
      });
    }
    onCoze?.(init);
    return new Response('event: Done\ndata: {}\n\n', {
      headers: { 'Content-Type': 'text/event-stream' },
    });
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 8, 4, 12));
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('Cloudflare Worker', () => {
  it('injects resolved global weather into the Coze workflow parameters', async () => {
    let cozeBody: Record<string, unknown> | undefined;
    const fetcher = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(input.toString());
      if (url.hostname === 'nominatim.openstreetmap.org') {
        return Response.json([{ lat: '48.8566', lon: '2.3522' }]);
      }
      if (url.hostname === 'api.open-meteo.com') {
        return Response.json({
          latitude: 48.86,
          longitude: 2.35,
          timezone: 'Europe/Paris',
          daily: {
            time: ['2026-09-05'],
            weather_code: [0],
            temperature_2m_min: [12],
            temperature_2m_max: [24],
            precipitation_probability_max: [5],
          },
        });
      }
      cozeBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
      return new Response('event: Done\ndata: {}\n\n');
    });
    const request = new Request('https://worker.test/api/outfit/generate', {
      method: 'POST',
      headers: { Origin: origin, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workflow_id: '7680787686953058346',
        parameters: {
          city: '巴黎', province: '法兰西岛', towns: '巴黎', villages: '巴黎',
          start_time: '2026.9.5', end_time: '2026.9.5',
        },
      }),
    });

    const response = await handleRequest(request, { COZE_API_TOKEN: 'secret' }, fetcher);

    expect(response.status).toBe(200);
    expect(fetcher).toHaveBeenCalledTimes(3);
    const sentParameters = cozeBody?.parameters as Record<string, unknown>;
    expect(JSON.parse(String(sentParameters.weather_data))).toMatchObject([
      { date: '2026-09-05', weather: '晴', timezone: 'Europe/Paris' },
    ]);
  });
  it('uses the platform fetch when invoked with a Cloudflare execution context', async () => {
    const upstream = createGenerateFetcher();
    vi.stubGlobal('fetch', upstream);
    const request = new Request('https://worker.test/api/outfit/generate', {
      method: 'POST',
      headers: { Origin: origin, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workflow_id: '7680787686953058346',
        parameters: {
          city: '巴黎', province: '法兰西岛', towns: '巴黎', villages: '巴黎',
          start_time: '2026.9.5', end_time: '2026.9.6',
        },
      }),
    });

    const response = await worker.fetch(
      request,
      { COZE_API_TOKEN: 'rotated-secret' },
      {} as ExecutionContext,
    );

    expect(response.status).toBe(200);
    expect(upstream).toHaveBeenCalledTimes(3);
  });

  it('forwards valid outfit requests with the secret authorization header', async () => {
    const upstream = createGenerateFetcher((init) => {
      expect(init?.headers).toMatchObject({ Authorization: 'Bearer rotated-secret' });
    });
    const request = new Request('https://worker.test/api/outfit/generate', {
      method: 'POST',
      headers: { Origin: origin, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workflow_id: '7680787686953058346',
        parameters: {
          city: '巴黎', province: '法兰西岛', towns: '巴黎', villages: '巴黎',
          start_time: '2026.9.5', end_time: '2026.9.6',
        },
      }),
    });

    const response = await handleRequest(request, { COZE_API_TOKEN: 'rotated-secret' }, upstream);

    expect(response.status).toBe(200);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(origin);
    expect(await response.text()).toContain('event: Done');
  });

  it('removes clipboard whitespace from the Coze token before authorization', async () => {
    const upstream = createGenerateFetcher((init) => {
      expect(init?.headers).toMatchObject({ Authorization: 'Bearer rotated-secret' });
    });
    const request = new Request('https://worker.test/api/outfit/generate', {
      method: 'POST',
      headers: { Origin: origin, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workflow_id: '7680787686953058346',
        parameters: {
          city: '巴黎', province: '法兰西岛', towns: '巴黎', villages: '巴黎',
          start_time: '2026.9.5', end_time: '2026.9.6',
        },
      }),
    });

    const response = await handleRequest(request, { COZE_API_TOKEN: '  rotated-\n\tsecret\r' }, upstream);
    expect(response.status).toBe(200);
  });

  it('rejects an untrusted browser origin', async () => {
    const request = new Request('https://worker.test/api/outfit/generate', {
      method: 'POST',
      headers: { Origin: 'https://evil.example' },
    });
    expect((await handleRequest(request, { COZE_API_TOKEN: 'secret' })).status).toBe(403);
  });

  it('normalizes Nominatim reverse geocoding', async () => {
    const upstream = vi.fn(async () => Response.json({
      display_name: 'Paris, Île-de-France, France',
      address: { state: 'Île-de-France', city: 'Paris', country: 'France' },
    }));
    const request = new Request('https://worker.test/api/location/reverse', {
      method: 'POST',
      headers: { Origin: origin, 'Content-Type': 'application/json' },
      body: JSON.stringify({ latitude: 48.8566, longitude: 2.3522 }),
    });

    const response = await handleRequest(request, { COZE_API_TOKEN: 'secret' }, upstream);
    expect(await response.json()).toMatchObject({
      province: 'Île-de-France', city: 'Paris', district: 'Paris',
    });
  });
});
