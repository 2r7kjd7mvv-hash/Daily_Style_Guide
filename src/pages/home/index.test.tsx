import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Taro from '@tarojs/taro';
import HomePage from './index';

vi.mock('@tarojs/taro', () => ({
  default: { navigateTo: vi.fn(() => Promise.resolve()) },
  useDidShow: vi.fn(),
}));

describe('HomePage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows only the new landing actions', () => {
    render(<HomePage />);
    expect(screen.getByText('你的专属出行穿搭助手')).toBeInTheDocument();
    expect(screen.getByText('开始设计我的出行穿搭')).toBeInTheDocument();
    expect(screen.getByText('历史方案')).toBeInTheDocument();
    expect(screen.queryByText('我的穿搭')).not.toBeInTheDocument();
    expect(screen.queryByText('最近穿搭')).not.toBeInTheDocument();
  });

  it('opens the form from the primary CTA but leaves history inert', () => {
    render(<HomePage />);
    fireEvent.click(screen.getByText('开始设计我的出行穿搭'));
    expect(Taro.navigateTo).toHaveBeenCalledWith({ url: '/pages/plan/index' });
    fireEvent.click(screen.getByText('历史方案'));
    expect(Taro.navigateTo).toHaveBeenCalledTimes(1);
  });
});
