import type {
  CityInfo,
  DailyOutfit,
  WorkflowGenerateRequest,
  WorkflowResultPayload,
  WorkflowStreamEvent,
} from '@/types';
import { OUTFIT_PLAN_LIST } from '../data/outfitList';

export interface WorkflowDraft {
  destination: CityInfo;
  startDate: string;
  endDate: string;
  stylePreference?: string;
  colorPreference?: string;
  avoidItems?: string;
  occasion?: string;
}

export interface StreamParseResult {
  events: WorkflowStreamEvent[];
  rest: string;
}

function parseEventFrame(frame: string): WorkflowStreamEvent | null {
  let event = '';
  let id: number | undefined;
  const dataLines: string[] = [];
  frame.split(/\r?\n/).forEach((line) => {
    if (line.startsWith('event:')) event = line.slice(6).trim();
    if (line.startsWith('id:')) {
      const parsed = Number(line.slice(3).trim());
      if (Number.isFinite(parsed)) id = parsed;
    }
    if (line.startsWith('data:')) dataLines.push(line.slice(5).trimStart());
  });
  if (!event) return null;
  let data: Record<string, unknown> = {};
  if (dataLines.length) {
    try {
      data = JSON.parse(dataLines.join('\n')) as Record<string, unknown>;
    } catch {
      data = { content: dataLines.join('\n') };
    }
  }
  return { id, event: event as WorkflowStreamEvent['event'], data };
}

export function parseSseFrames(buffer: string): StreamParseResult {
  const normalized = buffer.replace(/\r\n/g, '\n');
  const parts = normalized.split('\n\n');
  const hasCompleteTail = normalized.endsWith('\n\n');
  const rest = hasCompleteTail ? '' : parts.pop() || '';
  const events = parts
    .map(parseEventFrame)
    .filter((event): event is WorkflowStreamEvent => Boolean(event));
  return { events, rest: rest.replace(/\n/g, buffer.includes('\r\n') ? '\r\n' : '\n') };
}

function readImageEntry(entry: WorkflowResultPayload['image_url_list'][number] | undefined) {
  if (!entry) return {};
  if (typeof entry === 'object') return entry;
  const trimmed = entry.trim();
  if (/^https?:\/\//.test(trimmed)) return { image_url: trimmed };
  try {
    return JSON.parse(trimmed) as { image_url?: string; reasoning_content?: string };
  } catch {
    return {};
  }
}

export function normalizeWorkflowContent(content: string): DailyOutfit[] {
  let payload: WorkflowResultPayload;
  try {
    payload = JSON.parse(content) as WorkflowResultPayload;
  } catch {
    throw new Error('生成结果格式异常，请重新生成');
  }
  if (!Array.isArray(payload.output_list)) {
    throw new Error('生成结果格式异常，请重新生成');
  }
  return payload.output_list.map((daily, index) => {
    const image = readImageEntry(payload.image_url_list?.[index]);
    return {
      date: daily.date || payload.date_list?.[index] || '',
      city: daily.city || '',
      weather: daily.weather || '',
      temperature: daily.temperature || '',
      feeling: daily.feeling || '',
      top: daily.top || '',
      bottom: daily.bottom || '',
      shoes: daily.shoes || '',
      outerwear: daily.outerwear || '',
      accessories: daily.accessories || '',
      reminder: daily.reminder || '',
      image_url: image.image_url || daily.image_url,
      reasoning_content: image.reasoning_content || daily.reasoning_content,
    };
  });
}

function compactDate(value: string) {
  return value.split('-').map((part) => String(Number(part))).join('.');
}

function optional(value?: string) {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

export function buildWorkflowRequest(draft: WorkflowDraft): WorkflowGenerateRequest {
  const district = draft.destination.district || draft.destination.city;
  const parameters: WorkflowGenerateRequest['parameters'] = {
    city: draft.destination.city,
    province: draft.destination.province,
    towns: district,
    villages: district,
    start_time: compactDate(draft.startDate),
    end_time: compactDate(draft.endDate),
  };
  const entries = {
    style_preference: optional(draft.stylePreference),
    color_preference: optional(draft.colorPreference),
    avoid_items: optional(draft.avoidItems),
    occasion: optional(draft.occasion),
  };
  Object.entries(entries).forEach(([key, value]) => {
    if (value) parameters[key as keyof typeof entries] = value;
  });
  return { workflow_id: '7680787686953058346', parameters };
}

export interface GenerateHandlers {
  onEvent?: (event: WorkflowStreamEvent) => void;
  signal?: AbortSignal;
}

export async function generateOutfitPlan(
  request: WorkflowGenerateRequest,
  handlers: GenerateHandlers = {},
): Promise<{ source: 'live' | 'demo'; dailyList: DailyOutfit[] }> {
  const baseUrl = process.env.TARO_APP_API_BASE_URL?.replace(/\/$/, '');
  if (!baseUrl) {
    handlers.onEvent?.({ event: 'Message', data: { node_title: '天气分析' } });
    await new Promise((resolve) => setTimeout(resolve, 500));
    handlers.onEvent?.({ event: 'Message', data: { node_title: '穿搭生成' } });
    const sample = OUTFIT_PLAN_LIST[0].daily_list;
    const start = new Date(request.parameters.start_time.replace(/\./g, '-'));
    const end = new Date(request.parameters.end_time.replace(/\./g, '-'));
    const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);
    const dailyList = Array.from({ length: days }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return {
        ...sample[index % sample.length],
        date: date.toISOString().slice(0, 10),
        city: request.parameters.city,
        reasoning_content: `${request.parameters.style_preference || '简约大气'} · 本地演示方案`,
      };
    });
    return { source: 'demo', dailyList };
  }
  const response = await fetch(`${baseUrl}/api/outfit/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
    signal: handlers.signal,
  });
  if (!response.ok || !response.body) throw new Error('生成服务暂不可用，请稍后重试');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let finalContent = '';
  let lastId = -1;
  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });
    const parsed = parseSseFrames(buffer);
    buffer = parsed.rest;
    parsed.events.forEach((event) => {
      if (event.id !== undefined) {
        if (lastId >= 0 && event.id !== lastId + 1) throw new Error('生成数据传输不完整，请重试');
        lastId = event.id;
      }
      handlers.onEvent?.(event);
      if (event.event === 'Error') {
        throw new Error(String(event.data.error_message || '生成失败，请重试'));
      }
      if (event.event === 'Interrupt') throw new Error('生成流程需要补充信息，请返回修改条件');
      if (event.event === 'Message' && event.data.node_is_finish === true) {
        finalContent = String(event.data.content || '');
      }
    });
    if (done) break;
  }
  return { source: 'live', dailyList: normalizeWorkflowContent(finalContent) };
}
