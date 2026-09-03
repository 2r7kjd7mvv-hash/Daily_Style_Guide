import type {
  CityInfo,
  DailyOutfit,
  WorkflowGenerateRequest,
  WorkflowResultPayload,
  WorkflowStreamEvent,
} from '@/types';
import { OUTFIT_PLAN_LIST } from '../data/outfitList';
import { getApiBaseUrl } from './runtimeConfig';

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

function isViewableImageUrl(value?: string) {
  return Boolean(value && /^(https?:\/\/|data:image\/)/i.test(value.trim()));
}

function escapeXml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;',
  })[char] || char);
}

function shortItem(value?: string, max = 13) {
  const clean = (value || '暂无推荐')
    .replace(/^(上衣|下装|外套|鞋子|配饰)[：:]\s*/, '')
    .trim();
  return escapeXml(clean.length > max ? `${clean.slice(0, max)}…` : clean);
}

function createStrategyImage(daily: Partial<DailyOutfit>) {
  const city = escapeXml(daily.city || '旅行目的地');
  const date = escapeXml(daily.date || '今日');
  const weather = escapeXml([daily.weather, daily.temperature].filter(Boolean).join(' · '));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="960" viewBox="0 0 720 960">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#edf8f3"/><stop offset="1" stop-color="#dcefe9"/></linearGradient>
      <linearGradient id="coat" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#f7f0df"/><stop offset="1" stop-color="#d8c6a2"/></linearGradient>
    </defs>
    <rect width="720" height="960" rx="42" fill="url(#bg)"/>
    <circle cx="594" cy="118" r="88" fill="#fff" opacity=".45"/><circle cx="642" cy="250" r="38" fill="#8fcbbb" opacity=".22"/>
    <text x="54" y="78" font-family="Arial, sans-serif" font-size="23" fill="#268267" letter-spacing="3">DAILY STYLE GUIDE</text>
    <text x="54" y="132" font-family="Arial, sans-serif" font-size="42" font-weight="700" fill="#173c34">${city}</text>
    <text x="54" y="174" font-family="Arial, sans-serif" font-size="23" fill="#5b736d">${date}${weather ? `  ·  ${weather}` : ''}</text>
    <g transform="translate(74 232)">
      <circle cx="196" cy="70" r="58" fill="#e9bc94"/>
      <path d="M141 59c7-65 105-72 117 1-25-20-79-27-117-1Z" fill="#443a35"/>
      <path d="M108 165c31-37 64-51 88-51s58 14 89 51l42 252H65Z" fill="url(#coat)"/>
      <path d="M154 150h84l25 224H129Z" fill="#fffaf0"/>
      <path d="M113 399h73l-18 249H75Z" fill="#8fa6a2"/><path d="M206 399h72l39 249h-92Z" fill="#718a86"/>
      <path d="M58 637h115v42H42c-14 0-18-19-6-27Z" fill="#fdfdfb"/><path d="M222 637h111l24 24c8 8 2 18-10 18H220Z" fill="#fdfdfb"/>
      <path d="M108 165 66 354" stroke="#c0a77c" stroke-width="24" stroke-linecap="round"/><path d="M285 165 326 354" stroke="#c0a77c" stroke-width="24" stroke-linecap="round"/>
      <circle cx="326" cy="376" r="34" fill="#2f7968"/><path d="M304 352h44v76h-44Z" fill="#2f7968"/>
    </g>
    <g font-family="Arial, sans-serif">
      <rect x="416" y="278" width="250" height="76" rx="18" fill="#fff" opacity=".82"/><text x="438" y="309" font-size="18" fill="#2b8a6e">上衣</text><text x="438" y="338" font-size="23" fill="#243d37">${shortItem(daily.top)}</text>
      <rect x="416" y="370" width="250" height="76" rx="18" fill="#fff" opacity=".82"/><text x="438" y="401" font-size="18" fill="#2b8a6e">下装</text><text x="438" y="430" font-size="23" fill="#243d37">${shortItem(daily.bottom)}</text>
      <rect x="416" y="462" width="250" height="76" rx="18" fill="#fff" opacity=".82"/><text x="438" y="493" font-size="18" fill="#2b8a6e">外套</text><text x="438" y="522" font-size="23" fill="#243d37">${shortItem(daily.outerwear)}</text>
      <rect x="416" y="554" width="250" height="76" rx="18" fill="#fff" opacity=".82"/><text x="438" y="585" font-size="18" fill="#2b8a6e">鞋履</text><text x="438" y="614" font-size="23" fill="#243d37">${shortItem(daily.shoes)}</text>
      <rect x="416" y="646" width="250" height="76" rx="18" fill="#fff" opacity=".82"/><text x="438" y="677" font-size="18" fill="#2b8a6e">配饰</text><text x="438" y="706" font-size="23" fill="#243d37">${shortItem(daily.accessories)}</text>
      <text x="54" y="900" font-size="22" fill="#47675f">穿搭策略可视卡 · 图片生成后将自动替换</text>
    </g>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
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
    const normalized: DailyOutfit = {
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
      image_url: undefined,
      reasoning_content: image.reasoning_content || daily.reasoning_content,
    };
    const candidate = image.image_url || daily.image_url;
    normalized.image_url = isViewableImageUrl(candidate)
      ? candidate?.trim()
      : createStrategyImage(normalized);
    return normalized;
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
  const baseUrl = getApiBaseUrl();
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
