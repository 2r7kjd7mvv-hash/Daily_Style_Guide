import { describe, expect, it } from 'vitest';
import { buildPlanReturnUrl } from './citySelection';

describe('buildPlanReturnUrl', () => {
  it('returns to the plan with the complete selected destination', () => {
    const url = buildPlanReturnUrl({
      province: '国外',
      city: '法国 巴黎',
      district: 'Paris',
      fullName: '法国 巴黎 Paris',
    });

    expect(url.startsWith('/pages/plan/index?destination=')).toBe(true);
    const encoded = url.split('destination=')[1];
    expect(JSON.parse(decodeURIComponent(encoded))).toEqual({
      province: '国外',
      city: '法国 巴黎',
      district: 'Paris',
      fullName: '法国 巴黎 Paris',
    });
  });
});
