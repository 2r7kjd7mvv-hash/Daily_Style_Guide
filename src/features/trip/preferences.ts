export const TRIP_STYLE_OPTIONS = [
  { key: 'leisure', label: '休闲度假', description: '松弛舒适，适合漫步与度假' },
  { key: 'business', label: '商务出差', description: '利落得体，兼顾通勤与会面' },
  { key: 'outdoor', label: '运动户外', description: '轻便耐走，适合长时间活动' },
  { key: 'photo', label: '拍照出片', description: '强调层次与镜头表现力' },
] as const;
export const TRIP_COLOR_OPTIONS = [
  { key: 'oat', label: '燕麦白', hex: '#E8E0D2' }, { key: 'mist', label: '雾霾蓝', hex: '#AABBC8' },
  { key: 'sage', label: '鼠尾草绿', hex: '#A8B6A7' }, { key: 'latte', label: '奶茶棕', hex: '#B7A38D' },
  { key: 'blush', label: '灰粉', hex: '#C6A8A7' }, { key: 'charcoal', label: '炭灰', hex: '#666D69' },
] as const;
export type TripStyleKey = typeof TRIP_STYLE_OPTIONS[number]['key'];
export type TripColorKey = typeof TRIP_COLOR_OPTIONS[number]['key'];
export function toggleSelection<T>(values: readonly T[], value: T): T[] { return values.includes(value) ? values.filter((item) => item !== value) : [...values, value]; }
