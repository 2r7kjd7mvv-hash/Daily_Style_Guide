import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import worker, { handleRequest } from './index';
import { extractEndPayload } from './fanout';

const origin = 'https://2r7kjd7mvv-hash.github.io';

function sseFrame(name: string, data: Record<string, unknown>) {
  return `event: ${name}\ndata: ${JSON.stringify(data)}\n\n`;
}

function dayStream(date: string) {
  const content = JSON.stringify({
    date_list: [date],
    image_url_list: [`https://s.coze.cn/t/${date}/`],
    output_list: [{ date, city: '杭州', top: '上衣：测试款' }],
  });
  return [
    sseFrame('Message', { node_is_finish: true, node_title: 'End', node_type: 'End', content }),
    sseFrame('Done', {}),
  ].join('');
}

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
          time: ['2026-09-05'],
          weather_code: [0],
          temperature_2m_min: [12],
          temperature_2m_max: [24],
          precipitation_probability_max: [5],
        },
      });
    }
    onCoze?.(init);
    return new Response('event: Done\ndata: {}\n\n', {
      headers: { 'Content-Type': 'text/event-stream' },
    });
  });
}

const dayParams = {
  city: '杭州市', province: '浙江省', towns: '西湖区', villages: '西湖区',
  start_time: '2026.9.5', end_time: '2026.9.5',
};

function generateRequest(params: Record<string, unknown>) {
  return new Request('https://worker.test/api/outfit/generate', {
    method: 'POST',
    headers: { Origin: origin, 'Content-Type': 'application/json' },
    body: JSON.stringify({ workflow_id: '7680787686953058346', parameters: params }),
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
  it('injects resolved global weather into the Coze workflow parameters for a single day', async () => {
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
    const request = generateRequest(dayParams);

    const response = await handleRequest(request, { COZE_API_TOKEN: 'secret' }, fetcher);

    expect(response.status).toBe(200);
    expect(fetcher).toHaveBeenCalledTimes(3);
    const sentParameters = cozeBody?.parameters as Record<string, unknown>;
    expect(JSON.parse(String(sentParameters.weather_data))).toMatchObject([
      { date: '2026-09-05', weather: '晴', timezone: 'Europe/Paris' },
    ]);
  });

  it('splits a multi-day trip into single-day Coze runs and returns a merged stream', async () => {
    const multiDayParams = {
      ...dayParams,
      start_time: '2026.9.5',
      end_time: '2026.9.7',
    };
    const cozeBodies: Array<{ workflow_id: string; parameters: Record<string, unknown> }> = [];
    const fetcher = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(input.toString());
      if (url.hostname === 'nominatim.openstreetmap.org') {
        return Response.json([{ lat: '30.25', lon: '120.17' }]);
      }
      if (url.hostname === 'api.open-meteo.com') {
        return Response.json({
          latitude: 30.25,
          longitude: 120.17,
          timezone: 'Asia/Shanghai',
          daily: {
            time: ['2026-09-05', '2026-09-06', '2026-09-07'],
            weather_code: [0, 2, 80],
            temperature_2m_min: [12, 13, 15],
            temperature_2m_max: [24, 23, 22],
            precipitation_probability_max: [5, 20, 70],
          },
        });
      }
      const body = JSON.parse(String(init?.body)) as {
        workflow_id: string; parameters: Record<string, unknown>;
      };
      cozeBodies.push(body);
      const start = String(body.parameters.start_time);
      const date = `2026-${start.split('.')[1].padStart(2, '0')}-${start.split('.')[2].padStart(2, '0')}`;
      return new Response(dayStream(date), {
        headers: { 'Content-Type': 'text/event-stream' },
      });
    });

    const response = await handleRequest(
      generateRequest(multiDayParams),
      { COZE_API_TOKEN: 'rotated-secret' },
      fetcher,
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(origin);
    // 2 次天气解析 + 3 次按天调用 Coze
    expect(fetcher).toHaveBeenCalledTimes(5);
    expect(cozeBodies).toHaveLength(3);
    cozeBodies.forEach((body) => {
      expect(body.parameters.start_time).toBe(body.parameters.end_time);
      const singleDay = JSON.parse(String(body.parameters.weather_data)) as unknown[];
      expect(singleDay).toHaveLength(1);
    });

    const payload = extractEndPayload(await response.text());
    expect(payload?.date_list).toEqual(['2026-09-05', '2026-09-06', '2026-09-07']);
    expect(payload?.output_list).toHaveLength(3);
  });

  it('uses the platform fetch when invoked with a Cloudflare execution context', async () => {
    const upstream = createGenerateFetcher();
    vi.stubGlobal('fetch', upstream);
    const request = generateRequest(dayParams);

    const response = await worker.fetch(
      request,
      { COZE_API_TOKEN: 'rotated-secret' },
      {} as ExecutionContext,
    );

    expect(response.status).toBe(200);
    expect(upstream).toHaveBeenCalledTimes(3);
  });

  it('forwards valid single-day outfit requests with the secret authorization header', async () => {
    const upstream = createGenerateFetcher((init) => {
      expect(init?.headers).toMatchObject({ Authorization: 'Bearer rotated-secret' });
    });
    const response = await handleRequest(
      generateRequest(dayParams),
      { COZE_API_TOKEN: 'rotated-secret' },
      upstream,
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(origin);
    expect(await response.text()).toContain('event: Done');
  });

  it('removes clipboard whitespace from the Coze token before authorization', async () => {
    const upstream = createGenerateFetcher((init) => {
      expect(init?.headers).toMatchObject({ Authorization: 'Bearer rotated-secret' });
    });
    const response = await handleRequest(
      generateRequest(dayParams),
      { COZE_API_TOKEN: '  rotated-\n\tsecret\r' },
      upstream,
    );

    expect(response.status).toBe(200);
  });

  it('allows the 127.0.0.1 local dev origin', async () => {
    const upstream = createGenerateFetcher();
    const request = new Request('https://worker.test/api/outfit/generate', {
      method: 'POST',
      headers: { Origin: 'http://127.0.0.1:10086', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workflow_id: '7680787686953058346',
        parameters: dayParams,
      }),
    });
    const response = await handleRequest(request, { COZE_API_TOKEN: 'secret' }, upstream);
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
