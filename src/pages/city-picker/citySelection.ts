import type { CityInfo } from '@/types';

export function buildPlanReturnUrl(destination: CityInfo) {
  return `/pages/plan/index?destination=${encodeURIComponent(JSON.stringify(destination))}`;
}
