import { describe, expect, it } from 'vitest';
import { getTripStepAction } from './planFlow';

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
