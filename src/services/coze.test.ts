import { describe, expect, it } from 'vitest';
import {
  buildWorkflowRequest,
  normalizeWorkflowContent,
  parseSseFrames,
} from './coze';

describe('parseSseFrames', () => {
  it('keeps an incomplete frame for the next stream chunk', () => {
    const parsed = parseSseFrames(
      'id: 0\r\nevent: Message\r\ndata: {"content":"one"}\r\n\r\nid: 1\r\nevent: Done',
    );

    expect(parsed.events).toEqual([
      { id: 0, event: 'Message', data: { content: 'one' } },
    ]);
    expect(parsed.rest).toBe('id: 1\r\nevent: Done');
  });

  it('ignores ping frames without losing later data', () => {
    const parsed = parseSseFrames(
      'event: PING\ndata: {}\n\nevent: Done\ndata: {"debug_url":"ok"}\n\n',
    );

    expect(parsed.events.map((event) => event.event)).toEqual(['PING', 'Done']);
    expect(parsed.rest).toBe('');
  });
});

describe('normalizeWorkflowContent', () => {
  it('maps nested image JSON onto matching daily outfits', () => {
    const content = JSON.stringify({
      date_list: ['2026-09-02'],
      image_url_list: [JSON.stringify({
        image_url: 'https://example.com/look.webp',
        reasoning_content: '适合城市漫步',
      })],
      output_list: [{
        date: '2026-09-02',
        city: '延边朝鲜族自治州',
        weather: '晴',
        temperature: '11℃~24℃',
        feeling: '偏凉',
        top: '米白色长袖',
        bottom: '直筒裤',
        shoes: '小白鞋',
        outerwear: '薄外套',
        accessories: '墨镜',
        reminder: '注意防晒',
      }],
    });

    expect(normalizeWorkflowContent(content)[0]).toMatchObject({
      image_url: 'https://example.com/look.webp',
      reasoning_content: '适合城市漫步',
      top: '米白色长袖',
    });
  });

  it('keeps an outfit usable when its image is missing', () => {
    const content = JSON.stringify({
      date_list: ['2026-09-02'],
      image_url_list: [],
      output_list: [{ date: '2026-09-02', city: '巴黎', top: '针织衫' }],
    });

    expect(normalizeWorkflowContent(content)[0]).toMatchObject({
      city: '巴黎',
      top: '针织衫',
      image_url: undefined,
    });
  });

  it('rejects malformed workflow output with a recoverable message', () => {
    expect(() => normalizeWorkflowContent('not-json')).toThrow(
      '生成结果格式异常，请重新生成',
    );
  });
});

describe('buildWorkflowRequest', () => {
  it('converts the H5 draft to the exact Coze parameter contract', () => {
    expect(buildWorkflowRequest({
      destination: {
        province: '吉林省',
        city: '延边朝鲜族自治州',
        district: '延吉市',
        fullName: '吉林省 延边朝鲜族自治州 延吉市',
      },
      startDate: '2026-09-02',
      endDate: '2026-09-05',
      stylePreference: '韩国女团',
      colorPreference: ' 低饱和色 ',
      avoidItems: '',
      occasion: ' 城市漫步 ',
    })).toEqual({
      workflow_id: '7680787686953058346',
      parameters: {
        city: '延边朝鲜族自治州',
        province: '吉林省',
        towns: '延吉市',
        villages: '延吉市',
        start_time: '2026.9.2',
        end_time: '2026.9.5',
        style_preference: '韩国女团',
        color_preference: '低饱和色',
        occasion: '城市漫步',
      },
    });
  });
});
