import { describe, expect, it } from 'vitest';
import { toggleSelection, type TripStyleKey } from './preferences';

describe('trip preferences', () => {
  it('toggles a value without mutating the original selection', () => {
    const source: TripStyleKey[] = ['leisure'];
    expect(toggleSelection(source, 'photo')).toEqual(['leisure', 'photo']);
    expect(source).toEqual(['leisure']);
    expect(toggleSelection(['leisure', 'photo'], 'leisure')).toEqual(['photo']);
  });
});
