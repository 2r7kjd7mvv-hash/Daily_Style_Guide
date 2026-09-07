import { describe, expect, it, vi } from 'vitest';
import { resolveForecast } from './weather';

const parameters = {
  province: '法兰西岛大区',
  city: '巴黎',
  towns: '巴黎',
  villages: '巴黎',
  start_time: '2026.9.5',
  end_time: '2026.9.6',
};

describe('resolveForecast', () => {
  it('geocodes the destination and maps Open-Meteo daily weather', async () => {
    const fetcher = vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(input.toString());
      if (url.hostname === 'nominatim.openstreetmap.org') {
        expect(url.searchParams.get('q')).toContain('巴黎');
        return Response.json([{ lat: '48.8566', lon: '2.3522', display_name: 'Paris, France' }]);
      }
      expect(url.hostname).toBe('api.open-meteo.com');
      expect(url.searchParams.get('start_date')).toBe('2026-09-05');
      expect(url.searchParams.get('end_date')).toBe('2026-09-06');
      return Response.json({
        latitude: 48.86,
        longitude: 2.35,
        timezone: 'Europe/Paris',
        daily: {
          time: ['2026-09-05', '2026-09-06'],
          weather_code: [0, 61],
          temperature_2m_min: [12.2, 13.1],
          temperature_2m_max: [23.7, 21.6],
          precipitation_probability_max: [5, 70],
        },
      });
    });

    await expect(resolveForecast(parameters, fetcher, new Date(2026, 8, 4, 12))).resolves.toEqual([
      {
        date: '2026-09-05', weather: '晴', temperature_min: 12.2, temperature_max: 23.7,
        precipitation_probability: 5, weather_code: 0, latitude: 48.86, longitude: 2.35,
        timezone: 'Europe/Paris',
      },
      {
        date: '2026-09-06', weather: '小雨', temperature_min: 13.1, temperature_max: 21.6,
        precipitation_probability: 70, weather_code: 61, latitude: 48.86, longitude: 2.35,
        timezone: 'Europe/Paris',
      },
    ]);
  });

  it('rejects travel dates beyond the 16-day planning window', async () => {
    const fetcher = vi.fn();
    await expect(resolveForecast(
      { ...parameters, start_time: '2026.9.20', end_time: '2026.9.20' },
      fetcher,
      new Date(2026, 8, 4, 12),
    )).rejects.toThrow('开始日期请选择未来 16 天内');
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('accepts a trip planned ahead inside the 16-day window', async () => {
    const fetcher = vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(input.toString());
      if (url.hostname === 'nominatim.openstreetmap.org') {
        return Response.json([{ lat: '48.8566', lon: '2.3522' }]);
      }
      return Response.json({
        latitude: 48.86,
        longitude: 2.35,
        timezone: 'Europe/Paris',
        daily: {
          time: ['2026-09-18', '2026-09-19'],
          weather_code: [0, 2],
          temperature_2m_min: [10, 11],
          temperature_2m_max: [22, 23],
          precipitation_probability_max: [5, 10],
        },
      });
    });
    await expect(resolveForecast(
      { ...parameters, start_time: '2026.9.18', end_time: '2026.9.19' },
      fetcher,
      new Date(2026, 8, 4, 12),
    )).resolves.toHaveLength(2);
  });

  it('rejects an empty geocoding result', async () => {
    const fetcher = vi.fn(async () => Response.json([]));
    await expect(resolveForecast(parameters, fetcher, new Date(2026, 8, 4, 12)))
      .rejects.toThrow('未找到该目的地');
  });

  it('rejects an unsuccessful weather response', async () => {
    const fetcher = vi.fn(async (input: RequestInfo | URL) => {
      if (new URL(input.toString()).hostname === 'nominatim.openstreetmap.org') {
        return Response.json([{ lat: '48.8566', lon: '2.3522' }]);
      }
      return new Response('upstream unavailable', { status: 503 });
    });
    await expect(resolveForecast(parameters, fetcher, new Date(2026, 8, 4, 12)))
      .rejects.toThrow('天气服务暂不可用');
  });
});
