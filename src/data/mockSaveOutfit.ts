// cloud callFunction name: 'saveOutfit' mock
import { OUTFIT_PLAN_LIST } from './outfitList';
import type { OutfitPlan } from '@/types';

export default function mockSaveOutfit(data?: {
  plan: OutfitPlan;
}): Promise<{ code: number; message: string; data: { _id: string; created_at: number } }> {
  console.log('[Mock][saveOutfit] called with:', data);
  const plan = data?.plan;
  const id = plan?._id || `plan-${Date.now()}`;
  const now = Date.now();
  if (plan && !OUTFIT_PLAN_LIST.find((p) => p._id === id)) {
    OUTFIT_PLAN_LIST.unshift({ ...plan, _id: id, created_at: now, updated_at: now });
  }
  return Promise.resolve({
    code: 0,
    message: 'ok',
    data: { _id: id, created_at: now }
  });
}
