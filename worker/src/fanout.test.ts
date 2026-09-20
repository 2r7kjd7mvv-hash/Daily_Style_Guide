import { describe, expect, it, vi } from 'vitest';
import { buildBatchedStream, extractEndPayload } from './fanout';
import type { DailyForecast } from './weather';

function sseFrame(name: string, data: Record<string, unknown>) {
  return `event: ${name}\ndata: ${JSON.stringify(data)}\n\n`;
}

function dayStream(date: string, imageUrl: string) {
  const content = JSON.stringify({
    date_list: [date],
    image_url_list: [imageUrl],
    output_list: [{ date, city: '杭州', top: '上衣：测试款' }],
  });
  return [
    sseFrame('Message', { node_is_finish: true, node_title: 'End', node_type: 'End', content }),
    sseFrame('Done', {}),
  ].join('');
}

const forecast: DailyForecast[] = [
  {
    date: '2026-09-05', weather: '晴', temperature_min: 12, temperature_max: 24,
    precipitation_probability: 5, weather_code: 0, uv_index: 5.4, latitude: 30.2, longitude: 120.1, timezone: 'Asia/Shanghai',
  },
  {
    date: '2026-09-06', weather: '多云', temperature_min: 13, temperature_max: 23,
    precipitation_probability: 20, weather_code: 2, uv_index: 4.2, latitude: 30.2, longitude: 120.1, timezone: 'Asia/Shanghai',
  },
  {
    date: '2026-09-07', weather: '阵雨', temperature_min: 15, temperature_max: 22,
    precipitation_probability: 70, weather_code: 80, uv_index: 2.1, latitude: 30.2, longitude: 120.1, timezone: 'Asia/Shanghai',
  },
];

describe('extractEndPayload', () => {
  it('parses the End message content from a real-shaped SSE stream', () => {
    const stream = [
      sseFrame('Message', { node_title: '天气分析', content: 'progress' }),
      sseFrame('Message', {
        node_is_finish: true,
        node_title: 'End',
        node_type: 'End',
        content: JSON.stringify({
          date_list: ['2026-09-05'],
          image_url_list: ['https://s.coze.cn/t/x/'],
          output_list: [{ date: '2026-09-05', city: '杭州' }],
        }),
      }),
      sseFrame('Done', {}),
    ].join('');

    const payload = extractEndPayload(stream);
    expect(payload?.output_list).toHaveLength(1);
    expect(payload?.image_url_list[0]).toBe('https://s.coze.cn/t/x/');
  });

  it('returns null when the stream has no End payload', () => {
    expect(extractEndPayload('event: Done\ndata: {}\n\n')).toBeNull();
    expect(extractEndPayload('event: Error\ndata: {"error_message":"boom"}\n\n')).toBeNull();
  });
});

describe('buildBatchedStream', () => {
  it('calls Coze once per day with single-day parameters and merges in date order', async () => {
    const bodies: Array<{ workflow_id: string; parameters: Record<string, unknown> }> = [];
    const fetcher = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body)) as { workflow_id: string; parameters: Record<string, unknown> };
      bodies.push(body);
      const start = String(body.parameters.start_time);
      const date = `2026-${start.split('.')[1].padStart(2, '0')}-${start.split('.')[2].padStart(2, '0')}`;
      return new Response(dayStream(date, `https://s.coze.cn/t/${date}/`), {
        headers: { 'Content-Type': 'text/event-stream' },
      });
    });

    const stream = await buildBatchedStream({
      parameters: {
        city: '杭州市', province: '浙江省', towns: '西湖区', villages: '西湖区',
        start_time: '2026.9.5', end_time: '2026.9.7',
        style_preference: '简约大气',
      },
      forecast,
      token: 'secret',
      fetcher,
    });

    expect(fetcher).toHaveBeenCalledTimes(3);
    const starts = bodies.map((body) => body.parameters.start_time).sort();
    expect(starts).toEqual(['2026.9.5', '2026.9.6', '2026.9.7']);
    bodies.forEach((body) => {
      expect(body.parameters.end_time).toBe(body.parameters.start_time);
      const singleDay = JSON.parse(String(body.parameters.weather_data)) as DailyForecast[];
      expect(singleDay).toHaveLength(1);
      expect(body.workflow_id).toBe('7680787686953058346');
    });

    const payload = extractEndPayload(stream);
    expect(payload?.date_list).toEqual(['2026-09-05', '2026-09-06', '2026-09-07']);
    expect(payload?.output_list).toHaveLength(3);
    expect(stream).toContain('event: Done');
    expect(stream).toContain('第 2026-09-05 天方案已完成');
  });

  it('finishes gracefully when Coze returns an empty result for a day', async () => {
    const fetcher = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => {
      const content = JSON.stringify({ date_list: [], image_url_list: [], output_list: [] });
      return new Response(sseFrame('Message', {
        node_is_finish: true, node_title: 'End', node_type: 'End', content,
      }), { headers: { 'Content-Type': 'text/event-stream' } });
    });

    const stream = await buildBatchedStream({
      parameters: { city: '杭州', start_time: '2026.9.5', end_time: '2026.9.7' },
      forecast,
      token: 'secret',
      fetcher,
    });

    expect(stream).not.toContain('event: Error');
    expect(stream).toContain('event: Done');
    expect(extractEndPayload(stream)?.output_list).toEqual([]);
  });
});
