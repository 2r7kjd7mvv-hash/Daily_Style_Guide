import { describe, expect, it } from 'vitest';
import { normalizeLocationResponse } from './location';

describe('normalizeLocationResponse', () => {
  it('normalizes a Chinese Nominatim address into the city picker contract', () => {
    expect(normalizeLocationResponse({
      display_name: '延吉市, 延边朝鲜族自治州, 吉林省, 中国',
      address: {
        state: '吉林省',
        city: '延边朝鲜族自治州',
        county: '延吉市',
      },
    })).toEqual({
      province: '吉林省',
      city: '延边朝鲜族自治州',
      district: '延吉市',
      fullName: '吉林省 延边朝鲜族自治州 延吉市',
    });
  });

  it('supports international responses without a county', () => {
    expect(normalizeLocationResponse({
      display_name: 'Paris, Île-de-France, France',
      address: { state: 'Île-de-France', city: 'Paris', country: 'France' },
    })).toMatchObject({ province: 'Île-de-France', city: 'Paris', district: 'Paris' });
  });

  it('rejects responses without a recognizable city', () => {
    expect(() => normalizeLocationResponse({ address: {} })).toThrow('无法识别当前位置');
  });
});
