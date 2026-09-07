import { describe, expect, it } from 'vitest';
import { getTripStepAction, validateTravelDates } from './planFlow';

describe('getTripStepAction', () => {
  it('offers the AI generation next step when required trip details are selected', () => {
    expect(
      getTripStepAction({
        hasDestination: true,
        startDate: '2026-09-02',
        endDate: '2026-09-05',
        style: 'minimal',
      }),
    ).toEqual({
      label: '下一步：AI 生成',
      disabled: false,
    });
  });

  it('keeps the next step disabled when dates are incomplete', () => {
    expect(
      getTripStepAction({
        hasDestination: true,
        startDate: '2026-09-02',
        endDate: '',
        style: 'minimal',
      }),
    ).toEqual({
      label: '下一步：AI 生成',
      disabled: true,
    });
  });
});

describe('validateTravelDates', () => {
  const now = new Date(2026, 8, 4, 12);

  it('accepts a trip starting today', () => {
    expect(validateTravelDates('2026-09-04', '2026-09-04', now)).toBeNull();
  });

  it('accepts a trip ending on the seventh future calendar day', () => {
    expect(validateTravelDates('2026-09-05', '2026-09-11', now)).toBeNull();
  });

  it('rejects a start date before today', () => {
    expect(validateTravelDates('2026-09-03', '2026-09-04', now)).toBe('开始日期不能早于今天');
  });

  it('rejects a start date after the forecast window', () => {
    expect(validateTravelDates('2026-09-12', '2026-09-12', now)).toBe('开始日期请选择未来 7 天内');
  });

  it('rejects an end date before the start date', () => {
    expect(validateTravelDates('2026-09-06', '2026-09-05', now)).toBe('结束日期不能早于开始日期');
  });

  it('rejects a trip longer than seven calendar days', () => {
    expect(validateTravelDates('2026-09-04', '2026-09-11', now)).toBe('旅行周期最多选择 7 天');
  });

  it('rejects an end date after the forecast window', () => {
    expect(validateTravelDates('2026-09-11', '2026-09-12', now)).toBe('结束日期请选择未来 7 天内');
  });
});
