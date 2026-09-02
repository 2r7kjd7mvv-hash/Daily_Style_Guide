import type { OutfitPlan } from '@/types';

export interface OutfitQuery {
  destination_keyword?: string;
  start_date_from?: string;
  start_date_to?: string;
  created_from?: number;
  created_to?: number;
  page?: number;
  pageSize?: number;
}

export function filterAndSortPlans(plans: OutfitPlan[], query: OutfitQuery) {
  const keyword = query.destination_keyword?.trim().toLocaleLowerCase();
  return plans
    .filter((plan) => !keyword || plan.destination.fullName.toLocaleLowerCase().includes(keyword))
    .filter((plan) => !query.start_date_from || plan.end_date >= query.start_date_from)
    .filter((plan) => !query.start_date_to || plan.start_date <= query.start_date_to)
    .filter((plan) => !query.created_from || plan.created_at >= query.created_from)
    .filter((plan) => !query.created_to || plan.created_at <= query.created_to)
    .sort((a, b) => b.start_date.localeCompare(a.start_date));
}
