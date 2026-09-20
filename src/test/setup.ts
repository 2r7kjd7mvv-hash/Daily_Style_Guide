import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(() => cleanup());

Object.assign(globalThis, {
  defineAppConfig: (config: unknown) => config,
  TARO_APP_API_BASE_URL: '',
});

vi.mock('@tarojs/components', () => ({
  View: 'div',
  Text: 'span',
  Button: 'button',
  ScrollView: 'div',
  Image: 'img',
  Input: 'input',
  Picker: 'div',
}));
