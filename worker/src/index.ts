export interface WorkerEnv {
  COZE_API_TOKEN: string;
}

type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

const ALLOWED_ORIGINS = new Set([
  'https://2r7kjd7mvv-hash.github.io',
  'http://localhost:10086',
  'http://localhost:3000',
]);

function cors(origin: string) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
}

function json(body: unknown, status: number, origin: string) {
  return Response.json(body, { status, headers: cors(origin) });
}

function isGenerateBody(body: unknown): body is { workflow_id: string; parameters: Record<string, unknown> } {
  if (!body || typeof body !== 'object') return false;
  const value = body as Record<string, unknown>;
  const parameters = value.parameters as Record<string, unknown> | undefined;
  return value.workflow_id === '7680787686953058346'
    && Boolean(parameters)
    && ['city', 'province', 'towns', 'villages', 'start_time', 'end_time']
      .every((key) => typeof parameters?.[key] === 'string' && parameters[key]);
}

function normalizeAddress(value: Record<string, unknown>) {
  const address = (value.address || {}) as Record<string, string>;
  const province = address.state || address.province || address.country || '';
  const city = address.city || address.municipality || address.town || address.county || '';
  const district = address.county || address.suburb || address.town || city;
  if (!city) throw new Error('无法识别当前位置');
  return { province, city, district, fullName: [province, city, district].filter(Boolean).join(' ') };
}

export async function handleRequest(
  request: Request,
  env: WorkerEnv,
  fetcher: Fetcher = fetch,
): Promise<Response> {
  const origin = request.headers.get('Origin') || '';
  if (!ALLOWED_ORIGINS.has(origin)) return new Response('Forbidden', { status: 403 });
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) });
  if (request.method !== 'POST') return json({ message: 'Method not allowed' }, 405, origin);

  const url = new URL(request.url);
  if (url.pathname === '/api/outfit/generate') {
    const body = await request.json().catch(() => null);
    if (!isGenerateBody(body)) return json({ message: '请求参数不完整' }, 400, origin);
    const upstream = await fetcher('https://api.coze.cn/v1/workflow/stream_run', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.COZE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        ...cors(origin),
        'Content-Type': upstream.headers.get('Content-Type') || 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  }

  if (url.pathname === '/api/location/reverse') {
    const body = await request.json().catch(() => null) as { latitude?: number; longitude?: number } | null;
    if (!Number.isFinite(body?.latitude) || !Number.isFinite(body?.longitude)) {
      return json({ message: '经纬度无效' }, 400, origin);
    }
    const endpoint = new URL('https://nominatim.openstreetmap.org/reverse');
    endpoint.searchParams.set('lat', String(body?.latitude));
    endpoint.searchParams.set('lon', String(body?.longitude));
    endpoint.searchParams.set('format', 'jsonv2');
    endpoint.searchParams.set('accept-language', 'zh-CN');
    const upstream = await fetcher(endpoint, {
      headers: { 'User-Agent': 'DailyStyleGuide/1.0 (GitHub Pages travel outfit app)' },
    });
    if (!upstream.ok) return json({ message: '逆地理编码失败' }, 502, origin);
    try {
      return json(normalizeAddress(await upstream.json() as Record<string, unknown>), 200, origin);
    } catch (error) {
      return json({ message: error instanceof Error ? error.message : '无法识别当前位置' }, 422, origin);
    }
  }

  return json({ message: 'Not found' }, 404, origin);
}

export default {
  fetch(request: Request, env: WorkerEnv, _ctx: ExecutionContext) {
    return handleRequest(request, env);
  },
};
