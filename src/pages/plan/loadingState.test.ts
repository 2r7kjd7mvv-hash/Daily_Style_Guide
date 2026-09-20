import { describe, expect, it } from 'vitest';
import { getLoadingStepIndex } from './loadingState';

describe('getLoadingStepIndex', () => {
  it('ignores heartbeats and advances on workflow messages', () => {
    expect(getLoadingStepIndex({ event: 'PING', data: {} }, 2)).toBe(2);
    expect(getLoadingStepIndex({ event: 'Message', data: { node_title: '穿搭生成' } }, 2)).toBe(3);
  });
});
