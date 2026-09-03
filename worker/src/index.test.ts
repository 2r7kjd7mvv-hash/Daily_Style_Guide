import { describe, expect, it, vi } from 'vitest';
import worker, { handleRequest } from './index';

const origin = 'https://2r7kjd7mvv-hash.github.io';

describe('Cloudflare Worker', () => {
  it('uses the platform fetch when invoked with a Cloudflare execution context', async () => {
    const upstream = vi.fn(async () => new Response('event: Done\ndata: {}\n\n', {
      headers: { 'Content-Type': 'text/event-stream' },
    }));
    vi.stubGlobal('fetch', upstream);
    const request = new Request('https://worker.test/api/outfit/generate', {
      method: 'POST',
      headers: { Origin: origin, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workflow_id: '7680787686953058346',
        parameters: {
          city: '巴黎', province: '法兰西岛', towns: '巴黎', villages: '巴黎',
          start_time: '2026.9.2', end_time: '2026.9.4',
        },
      }),
    });

    const response = await worker.fetch(
      request,
      { COZE_API_TOKEN: 'rotated-secret' },
      {} as ExecutionContext,
    );

    expect(response.status).toBe(200);
    vi.unstubAllGlobals();
  });

  it('forwards valid outfit requests with the secret authorization header', async () => {
    const upstream = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      expect(init?.headers).toMatchObject({ Authorization: 'Bearer rotated-secret' });
      return new Response('event: Done\ndata: {}\n\n', {
        headers: { 'Content-Type': 'text/event-stream' },
      });
    });
    const request = new Request('https://worker.test/api/outfit/generate', {
      method: 'POST',
      headers: { Origin: origin, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workflow_id: '7680787686953058346',
        parameters: {
          city: '巴黎', province: '法兰西岛', towns: '巴黎', villages: '巴黎',
          start_time: '2026.9.2', end_time: '2026.9.4',
        },
      }),
    });

    const response = await handleRequest(request, { COZE_API_TOKEN: 'rotated-secret' }, upstream);

    expect(response.status).toBe(200);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(origin);
    expect(await response.text()).toContain('event: Done');
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
