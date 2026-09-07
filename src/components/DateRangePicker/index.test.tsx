import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@tarojs/components', () => {
  const React = require('react');
  return {
    View: 'div',
    Text: 'span',
    Button: 'button',
    // Drop Taro-only props (e.g. scrollX) so React DOM renders without warnings.
    ScrollView: ({ scrollX: _scrollX, children, ...rest }: any) =>
      React.createElement('div', rest, children),
    Picker: 'div',
  };
});

import DateRangePicker from './index';

describe('DateRangePicker shortcuts', () => {
  it('offers a one-day (day trip) shortcut', () => {
    const markup = renderToStaticMarkup(
      <DateRangePicker
        startDate="2026-09-04"
        endDate="2026-09-07"
        minDate="2026-09-04"
      />,
    );

    expect(markup).toContain('1日游');
  });

  it('renders a single-day trip as one day, zero nights and one outfit', () => {
    const markup = renderToStaticMarkup(
      <DateRangePicker
        startDate="2026-09-04"
        endDate="2026-09-04"
        minDate="2026-09-04"
      />,
    );

    expect(markup).toContain('天 0 晚 · 生成 1 套穿搭');
  });
});
