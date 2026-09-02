// cloud callFunction name: 'getOutfits' mock
import { OUTFIT_PLAN_LIST } from './outfitList';
import type { OutfitPlan } from '@/types';

interface Query {
  destination_keyword?: string;
  start_date_from?: string;
  start_date_to?: string;
  created_from?: number;
  created_to?: number;
  page?: number;
  pageSize?: number;
}

export default function mockGetOutfits(query?: Query): Promise<{
  code: number;
  message: string;
  data: { list: OutfitPlan[]; total: number; page: number; pageSize: number };
}> {
  console.log('[Mock][getOutfits] query:', query);
  let list = [...OUTFIT_PLAN_LIST];
  const q = query || {};
  if (q.destination_keyword) {
    const kw = q.destination_keyword;
    list = list.filter((p) => p.destination.fullName.includes(kw));
  }
  if (q.start_date_from) {
    list = list.filter((p) => p.end_date >= q.start_date_from!);
  }
  if (q.start_date_to) {
    list = list.filter((p) => p.start_date <= q.start_date_to!);
  }
  if (q.created_from) {
    list = list.filter((p) => p.created_at >= q.created_from!);
  }
  if (q.created_to) {
    list = list.filter((p) => p.created_at <= q.created_to!);
  }
  list.sort((a, b) => b.created_at - a.created_at);
  const total = list.length;
  const page = q.page || 1;
  const pageSize = q.pageSize || 20;
  const start = (page - 1) * pageSize;
  list = list.slice(start, start + pageSize);
  return Promise.resolve({
    code: 0,
    message: 'ok',
    data: { list, total, page, pageSize }
  });
}
