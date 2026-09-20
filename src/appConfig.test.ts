import { describe, expect, it } from 'vitest';
import config from './app.config';

describe('app navigation', () => {
  it('does not configure a bottom tab bar', () => {
    expect(config).not.toHaveProperty('tabBar');
  });
});
