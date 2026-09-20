export type WeatherFetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export interface ForecastParameters {
  province: string;
  city: string;
  towns: string;
  villages: string;
  start_time: string;
  end_time: string;
}

export interface DailyForecast {
  date: string;
  weather: string;
  temperature_min: number;
  temperature_max: number;
  precipitation_probability: number;
  weather_code: number;
  uv_index: number;
  latitude: number;
  longitude: number;
  timezone: string;
}

interface GeocodingResult {
  lat?: string;
  lon?: string;
}

interface ForecastResponse {
  latitude?: number;
  longitude?: number;
  timezone?: string;
  daily?: {
    time?: string[];
    weather_code?: number[];
    temperature_2m_min?: number[];
    temperature_2m_max?: number[];
    precipitation_probability_max?: number[];
    uv_index_max?: number[];
  };
}

const DAY_MS = 86400000;

function parseDate(value: string) {
  const match = /^(\d{4})[.-](\d{1,2})[.-](\d{1,2})$/.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const time = Date.UTC(year, month - 1, day);
  const date = new Date(time);
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return null;
  }
  return date;
}

function formatDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function validateDates(startValue: string, endValue: string, now: Date) {
  const start = parseDate(startValue);
  const end = parseDate(endValue);
  if (!start || !end) throw new Error('请完善日期');

  const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const planningMax = new Date(today.getTime() + 15 * DAY_MS);
  if (start < today) throw new Error('开始日期不能早于今天');
  if (start > planningMax) throw new Error('开始日期请选择未来 16 天内');
  if (end < start) throw new Error('结束日期不能早于开始日期');
  if (end > planningMax) throw new Error('结束日期请选择未来 16 天内');
  if (Math.round((end.getTime() - start.getTime()) / DAY_MS) + 1 > 7) {
    throw new Error('旅行周期最多选择 7 天');
  }
  return { start: formatDate(start), end: formatDate(end) };
}

function weatherLabel(code: number) {
  if (code === 0) return '晴';
  if (code <= 3) return '多云';
  if (code === 45 || code === 48) return '雾';
  if (code >= 51 && code <= 57) return '毛毛雨';
  if (code >= 61 && code <= 65) return code === 61 ? '小雨' : code === 63 ? '中雨' : '大雨';
  if (code >= 66 && code <= 67) return '冻雨';
  if (code >= 71 && code <= 77) return '雪';
  if (code >= 80 && code <= 82) return '阵雨';
  if (code >= 85 && code <= 86) return '阵雪';
  if (code >= 95) return '雷雨';
  return '天气变化';
}

function requiredNumber(value: unknown, message: string) {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(message);
  return value;
}

export async function resolveForecast(
  parameters: ForecastParameters,
  fetcher: WeatherFetcher,
  now = new Date(),
): Promise<DailyForecast[]> {
  const dates = validateDates(parameters.start_time, parameters.end_time, now);
  const destination = [parameters.villages, parameters.towns, parameters.city, parameters.province]
    .map((value) => value.trim())
    .filter((value, index, list) => value && list.indexOf(value) === index)
    .join(', ');

  const geocodingUrl = new URL('https://nominatim.openstreetmap.org/search');
  geocodingUrl.searchParams.set('q', destination);
  geocodingUrl.searchParams.set('format', 'jsonv2');
  geocodingUrl.searchParams.set('limit', '1');
  geocodingUrl.searchParams.set('accept-language', 'zh-CN,en');
  const geocodingResponse = await fetcher(geocodingUrl, {
    headers: { 'User-Agent': 'DailyStyleGuide/1.0 (global travel forecast)' },
  });
  if (!geocodingResponse.ok) throw new Error('目的地解析服务暂不可用');
  const locations = await geocodingResponse.json() as GeocodingResult[];
  const latitude = Number(locations[0]?.lat);
  const longitude = Number(locations[0]?.lon);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) throw new Error('未找到该目的地');

  const forecastUrl = new URL('https://api.open-meteo.com/v1/forecast');
  forecastUrl.searchParams.set('latitude', String(latitude));
  forecastUrl.searchParams.set('longitude', String(longitude));
  forecastUrl.searchParams.set('daily', [
    'weather_code',
    'temperature_2m_min',
    'temperature_2m_max',
    'precipitation_probability_max',
    'uv_index_max',
  ].join(','));
  forecastUrl.searchParams.set('timezone', 'auto');
  forecastUrl.searchParams.set('start_date', dates.start);
  forecastUrl.searchParams.set('end_date', dates.end);
  const forecastResponse = await fetcher(forecastUrl);
  if (!forecastResponse.ok) throw new Error('天气服务暂不可用');
  const forecast = await forecastResponse.json() as ForecastResponse;
  const daily = forecast.daily;
  if (!daily?.time?.length) throw new Error('目的地暂无天气数据');

  return daily.time.map((date, index) => {
    const code = requiredNumber(daily.weather_code?.[index], '天气数据不完整');
    return {
      date,
      weather: weatherLabel(code),
      temperature_min: requiredNumber(daily.temperature_2m_min?.[index], '天气数据不完整'),
      temperature_max: requiredNumber(daily.temperature_2m_max?.[index], '天气数据不完整'),
      precipitation_probability: requiredNumber(
        daily.precipitation_probability_max?.[index],
        '天气数据不完整',
      ),
      weather_code: code,
      uv_index: requiredNumber(daily.uv_index_max?.[index], '天气数据不完整'),
      latitude: requiredNumber(forecast.latitude, '天气数据不完整'),
      longitude: requiredNumber(forecast.longitude, '天气数据不完整'),
      timezone: forecast.timezone || 'auto',
    };
  });
}
