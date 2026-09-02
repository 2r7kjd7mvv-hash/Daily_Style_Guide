import type { BannerItem } from '@/types';

// 图片使用 picsum 分类：人物/服饰类 64, 103, 220, 225, 230, 250, 1011, 1027
export const BANNER_LIST: BannerItem[] = [
  {
    id: 'banner-1',
    image: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=86',
    title: 'AI 每日穿搭',
    desc: '结合目的地天气，定制你的专属旅行穿搭',
    buttonText: '设计我的穿搭',
    action: '/pages/plan/index'
  },
  {
    id: 'banner-2',
    image: 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=1200&q=86',
    title: '旅行穿搭灵感',
    desc: '不同城市文化下的穿搭风格参考',
    action: '/pages/outfits/index'
  },
  {
    id: 'banner-3',
    image: 'https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?auto=format&fit=crop&w=1200&q=86',
    title: '游玩拍照指南',
    desc: '上镜又舒适，出片率 200% 的穿搭秘诀',
    action: '/pages/plan/index'
  },
  {
    id: 'banner-4',
    image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1200&q=86',
    title: '行李极简清单',
    desc: '一衣多穿，轻装出行无负担',
    action: '/pages/outfits/index'
  }
];

export const DEFAULT_CITY = {
  province: '吉林',
  city: '延边朝鲜族自治州',
  district: '延吉市',
  fullName: '吉林 延边朝鲜族自治州 延吉市'
};
