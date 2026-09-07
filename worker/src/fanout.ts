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

interface SseFrame {
  name: string;
  data: unknown;
  id?: number;
}

const COZE_RUN_URL = 'https://api.coze.cn/v1/workflow/stream_run';

function sseText(events: SseFrame[]) {
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

async function runDayWithRetry(
  parameters: Record<string, unknown>,
  day: DailyForecast,
  token: string,
  fetcher: WeatherFetcher,
  dayIndex: number,
  attempts = 2,
): Promise<{ payload: DayEndPayload; date: string }> {
  let lastError: unknown = null;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 150000);
    try {
      const fetcherWithTimeout: WeatherFetcher = (input, init) =>
        fetcher(input, { ...init, signal: controller.signal });
      return await runDay(parameters, day, token, fetcherWithTimeout, dayIndex);
    } catch (error) {
      lastError = error;
      if (attempt >= attempts) break;
    } finally {
      clearTimeout(timer);
    }
  }
  if (lastError instanceof Error) throw lastError;
  throw new Error(`第 ${dayIndex + 1} 天（${day.date}）生成失败，请重试`);
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

interface DayResult {
  date: string;
  payload: DayEndPayload;
}

/**
 * 并行跑 N 个单日请求，每完成一天立即把进度帧写入流，
 * 全部完成后按日期顺序合并 End 并写入 Done。任一失败写入 Error 后关闭。
 */
export function createBatchedStream(options: BatchedGenerateOptions): ReadableStream<Uint8Array> {
  const { parameters, forecast, token, fetcher, concurrency = 3 } = options;
  const encoder = new TextEncoder();
  let heartbeat: ReturnType<typeof setInterval> | undefined;

  return new ReadableStream<Uint8Array>({
    start(controller) {
      const results = new Array<DayResult | null>(forecast.length).fill(null);
      let next = 0;
      let finished = 0;
      let closed = false;

      const enqueueFrames = (events: SseFrame[]) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(sseText(events)));
        } catch {
          closed = true;
        }
      };

      const closeAfter = (errorMessage?: string) => {
        if (closed) return;
        if (heartbeat) clearInterval(heartbeat);
        if (errorMessage) {
          enqueueFrames([{ name: 'Error', data: { error_message: errorMessage } }]);
        }
        closed = true;
        try {
          controller.close();
        } catch {
          // 已关闭则忽略
        }
      };

      // 长时间无进度时保持连接活跃，避免中间代理/浏览器把空闲长连接掐断
      heartbeat = setInterval(() => {
        enqueueFrames([{ name: 'PING', data: { content: '{}' } }]);
      }, 15000);

      const scheduleNext = () => {
        if (closed || next >= forecast.length) return;
        const index = next;
        next += 1;
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        runDayWithRetry(parameters, forecast[index], token, fetcher, index).then(
          ({ payload, date }) => {
            results[index] = { date, payload };
            enqueueFrames([{
              name: 'Message',
              data: { node_title: '穿搭生成', content: `第 ${date} 天方案已完成` },
            }]);
            finished += 1;
            if (finished === forecast.length) {
              const merged: DayEndPayload = {
                date_list: [],
                image_url_list: [],
                output_list: [],
              };
              results
                .filter((item): item is DayResult => item !== null)
                .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
                .forEach(({ date, payload }) => {
                  merged.date_list.push(...(payload.date_list?.length ? payload.date_list : [date]));
                  merged.image_url_list.push(...payload.image_url_list);
                  merged.output_list.push(...payload.output_list);
                });
              enqueueFrames([
                {
                  name: 'Message',
                  data: {
                    node_is_finish: true,
                    node_title: 'End',
                    node_type: 'End',
                    content: JSON.stringify(merged),
                  },
                },
                { name: 'Done', data: {} },
              ]);
              closeAfter();
              return;
            }
            scheduleNext();
          },
          (error: unknown) => {
            const message = error instanceof Error ? error.message : '生成失败，请重试';
            closeAfter(message);
          },
        );
      };

      for (let i = 0; i < Math.min(concurrency, forecast.length); i += 1) {
        scheduleNext();
      }
      if (forecast.length === 0) closeAfter();
    },
    cancel() {
      // 客户端中断：停止写入
      if (heartbeat) clearInterval(heartbeat);
    },
  });
}

export async function buildBatchedStream(options: BatchedGenerateOptions) {
  const stream = createBatchedStream(options);
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let text = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    text += decoder.decode(value, { stream: true });
  }
  text += decoder.decode();
  return text;
}
