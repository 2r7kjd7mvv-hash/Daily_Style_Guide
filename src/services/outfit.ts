import Taro from '@tarojs/taro';
import { OUTFIT_PLAN_LIST } from '@/data/outfitList';
import type { OutfitPlan, UserInfo } from '@/types';
import { filterAndSortPlans, type OutfitQuery } from './outfitQuery';

const STORAGE_KEY = 'daily-style-guide:outfit-plans:v1';

function readPlans(): OutfitPlan[] {
  const saved = Taro.getStorageSync(STORAGE_KEY);
  if (Array.isArray(saved)) return saved;
  const seeded = OUTFIT_PLAN_LIST.map((plan) => ({ ...plan }));
  Taro.setStorageSync(STORAGE_KEY, seeded);
  return seeded;
}

function writePlans(plans: OutfitPlan[]) {
  Taro.setStorageSync(STORAGE_KEY, plans);
}

export async function login(): Promise<UserInfo> {
  return {
    openid: 'h5-guest',
    nickName: '旅行体验官',
    avatarUrl: '',
    created_at: Date.now(),
  };
}

export async function saveOutfitPlan(plan: OutfitPlan) {
  const now = Date.now();
  const id = plan._id || `plan-${now}`;
  const stored = readPlans().filter((item) => item._id !== id);
  writePlans([{ ...plan, _id: id, created_at: plan.created_at || now, updated_at: now }, ...stored]);
  return { _id: id, created_at: now };
}

export async function getOutfitPlans(query: OutfitQuery = {}) {
  const filtered = filterAndSortPlans(readPlans(), query);
  const page = query.page || 1;
  const pageSize = query.pageSize || 20;
  const start = (page - 1) * pageSize;
  return {
    list: filtered.slice(start, start + pageSize),
    total: filtered.length,
    page,
    pageSize,
  };
}
