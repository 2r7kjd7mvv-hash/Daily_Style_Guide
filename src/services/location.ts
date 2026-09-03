import type { CityInfo } from '@/types';
import { getApiBaseUrl } from './runtimeConfig';

interface NominatimAddress {
  state?: string;
  province?: string;
  city?: string;
  town?: string;
  municipality?: string;
  county?: string;
  suburb?: string;
  country?: string;
}

export interface NominatimResponse {
  display_name?: string;
  address?: NominatimAddress;
}

export function normalizeLocationResponse(response: NominatimResponse): CityInfo {
  const address = response.address || {};
  const province = address.state || address.province || address.country || '';
  const city = address.city || address.municipality || address.town || address.county || '';
  const district = address.county || address.suburb || address.town || city;
  if (!city) throw new Error('无法识别当前位置');
  return {
    province,
    city,
    district,
    fullName: [province, city, district].filter(Boolean).join(' '),
  };
}

function getCoordinates() {
  return new Promise<GeolocationCoordinates>((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('当前浏览器不支持定位，请手动选择城市'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position.coords),
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          reject(new Error('定位权限未开启，请在浏览器设置中允许定位'));
        } else if (error.code === error.TIMEOUT) {
          reject(new Error('定位超时，请重试或手动选择城市'));
        } else {
          reject(new Error('暂时无法获取位置，请手动选择城市'));
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
    );
  });
}

export async function locateCurrentCity(): Promise<CityInfo> {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) throw new Error('尚未配置定位服务，请手动选择城市');
  const coords = await getCoordinates();
  const response = await fetch(`${baseUrl}/api/location/reverse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ latitude: coords.latitude, longitude: coords.longitude }),
  });
  if (!response.ok) throw new Error('城市识别失败，请手动选择城市');
  return normalizeLocationResponse(await response.json() as NominatimResponse);
}
