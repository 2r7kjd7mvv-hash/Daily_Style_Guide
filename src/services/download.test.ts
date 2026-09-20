import { describe, expect, it, vi } from 'vitest';
import { downloadRemoteImage } from './download';

describe('downloadRemoteImage', () => {
  it('creates and clicks a temporary download link', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(new Blob(['image']))));
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: vi.fn(() => 'blob:test') });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

    await downloadRemoteImage('https://image.example/outfit.jpg', 'outfit.jpg');
    expect(click).toHaveBeenCalledOnce();
  });

  it('rejects an empty image', async () => {
    await expect(downloadRemoteImage('')).rejects.toThrow('暂无可下载图片');
  });
});
