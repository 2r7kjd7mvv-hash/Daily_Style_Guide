import type { DailyForecast, WeatherFetcher } from './weather';

export interface BatchedGenerateOptions {
  parameters: Record<string, unknown>;
  forecast: DailyForecast[];
  token: string;
  fetcher: WeatherFetcher;
  concurrency?: number;
}

export interface DayEndPayload {
  date_list: string[];
  image_url_list: Array<string | { image_url?: string; reasoning_content?: string }>;
  output_list: Array<Record<string, unknown>>;
}

interface SseData {
  node_title?: string;
  node_is_finish?: boolean;
  content?: string;
  error_message?: string;
}

const COZE_RUN_URL = 'https://api.coze.cn/v1/workflow/stream_run';

function sseText(events: Array<{ name: string; data: unknown; id?: number }>) {
  return events
    .map(({ name, data, id }) => {
      const lines = [
        ...(id === undefined ? [] : [`id: ${id}`]),
        `event: ${name}`,
        `data: ${JSON.stringify(data)}`,
      ];
      return `${lines.join('\n')}\n\n`;
    })
    .join('');
}

function sseData(frame: string): SseData | null {
  let event = '';
  const dataLines: string[] = [];
  frame.split(/\r?\n/).forEach((line) => {
    if (line.startsWith('event:')) event = line.slice(6).trim();
    if (line.startsWith('data:')) dataLines.push(line.slice(5).trimStart());
  });
  if (event !== 'Message' || !dataLines.length) return null;
  try {
    return JSON.parse(dataLines.join('\n')) as SseData;
  } catch {
    return null;
  }
}

export function extractEndPayload(stream: string): DayEndPayload | null {
  const normalized = stream.replace(/\r\n/g, '\n');
  const frames = normalized.split('\n\n');
  for (const frame of frames) {
    const data = sseData(frame);
    if (data?.node_title === 'End' && data.node_is_finish === true && data.content) {
      try {
        const payload = JSON.parse(data.content) as DayEndPayload;
        if (Array.isArray(payload.output_list)) return payload;
      } catch {
        return null;
      }
    }
  }
  return null;
}

function compactDate(value: string) {
  return value
    .split('-')
    .map((part) => String(Number(part)))
    .join('.');
}

async function runDay(
  parameters: Record<string, unknown>,
  day: DailyForecast,
  token: string,
  fetcher: WeatherFetcher,
  dayIndex: number,
): Promise<{ payload: DayEndPayload; date: string }> {
  const dayDate = compactDate(day.date);
  const response = await fetcher(COZE_RUN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token.replace(/[\s\u0000-\u001F\u007F]+/g, '')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      workflow_id: '7680787686953058346',
      parameters: {
        ...parameters,
        start_time: dayDate,
        end_time: dayDate,
        weather_data: JSON.stringify([day]),
      },
    }),
  });
  if (!response.ok) {
    throw new Error(`第 ${dayIndex + 1} 天（${day.date}）生成服务暂不可用`);
  }
  const stream = await response.text();
  const payload = extractEndPayload(stream);
  if (!payload || !payload.output_list.length) {
    throw new Error(`第 ${dayIndex + 1} 天（${day.date}）生成失败，请重试`);
  }
  return { payload, date: day.date };
}

async function mapConcurrent<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await worker(items[index], index);
    }
  });
  await Promise.all(runners);
  return results;
}

export async function buildBatchedStream(options: BatchedGenerateOptions) {
  const { parameters, forecast, token, fetcher, concurrency = 3 } = options;
  const days = await mapConcurrent(forecast, concurrency, (day, index) =>
    runDay(parameters, day, token, fetcher, index),
  );
  days.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  const merged: DayEndPayload = {
    date_list: [],
    image_url_list: [],
    output_list: [],
  };
  const messages: Array<{ name: string; data: unknown }> = [];
  days.forEach(({ date, payload }) => {
    merged.date_list.push(...(payload.date_list?.length ? payload.date_list : [date]));
    merged.image_url_list.push(...payload.image_url_list);
    merged.output_list.push(...payload.output_list);
    messages.push({
      name: 'Message',
      data: {
        node_title: '穿搭生成',
        content: `第 ${date} 天方案已完成`,
      },
    });
  });

  messages.push({
    name: 'Message',
    data: {
      node_is_finish: true,
      node_title: 'End',
      node_type: 'End',
      content: JSON.stringify(merged),
    },
  });
  messages.push({ name: 'Done', data: {} });
  return sseText(messages);
}
