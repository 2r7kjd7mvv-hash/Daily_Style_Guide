import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MotionSurface } from './index';

describe('MotionSurface', () => {
  it('renders motion content without changing its accessible text', () => {
    render(<MotionSurface>柔和内容</MotionSurface>);
    expect(screen.getByText('柔和内容')).toBeInTheDocument();
  });
});
