import { describe, expect, it } from 'vitest';
import { resolveApiBaseUrl } from './runtimeConfig';

describe('resolveApiBaseUrl', () => {
  it('uses demo mode when the browser has no injected process object', () => {
    expect(resolveApiBaseUrl(undefined)).toBe('');
  });

  it('normalizes an injected Worker URL', () => {
    expect(resolveApiBaseUrl({
      env: { TARO_APP_API_BASE_URL: 'https://style-worker.example.workers.dev/' },
    })).toBe('https://style-worker.example.workers.dev');
  });
});
