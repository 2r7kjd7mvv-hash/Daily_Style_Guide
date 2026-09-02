import { describe, expect, it } from 'vitest';
import { filterAndSortPlans } from './outfitQuery';
import type { OutfitPlan } from '@/types';

const plans: OutfitPlan[] = [
  {
    _id: 'past',
    destination: { province: '上海', city: '上海市', fullName: '上海 上海市' },
    start_date: '2026-08-01',
    end_date: '2026-08-03',
    style_preference: 'minimal',
    daily_list: [],
    created_at: 10,
    updated_at: 10,
  },
  {
    _id: 'future',
    destination: { province: '法国', city: '巴黎', fullName: '法国 巴黎' },
    start_date: '2026-10-01',
    end_date: '2026-10-06',
    style_preference: 'european',
    daily_list: [],
    created_at: 20,
    updated_at: 20,
  },
];

describe('filterAndSortPlans', () => {
  it('sorts by travel start date descending by default', () => {
    expect(filterAndSortPlans(plans, {}).map((plan) => plan._id)).toEqual(['future', 'past']);
  });

  it('matches destination and overlapping trip dates', () => {
    expect(filterAndSortPlans(plans, {
      destination_keyword: '巴黎',
      start_date_from: '2026-10-03',
      start_date_to: '2026-10-04',
    }).map((plan) => plan._id)).toEqual(['future']);
  });

  it('returns no trip when the query range does not overlap', () => {
    expect(filterAndSortPlans(plans, {
      start_date_from: '2026-09-01',
      start_date_to: '2026-09-03',
    })).toEqual([]);
  });
});
