// ============================================
// 全局类型定义
// ============================================

/** 省市区信息 */
export interface CityInfo {
  province: string;
  city: string;
  district?: string;
  fullName: string; // "吉林 延边朝鲜族自治州 延吉市"
}

/** 天气信息单日 */
export interface DailyWeather {
  predict_date: string; // YYYY-MM-DD
  condition: string; // 整体状况
  weather_day: string; // 白天天气
  temp_low: number;
  temp_high: number;
  wind_dir_day: string;
  wind_level_day: string;
  humidity: number;
}

/** 单日天气分析（WeatherAnalysis 输出） */
export interface WeatherAnalysis {
  date: string;
  weather_summary: string;
  temperature_summary: string;
  feeling: '寒冷' | '偏凉' | '舒适' | '偏热' | '炎热';
  required_items: string[];
  outfit_requirements: string;
  outerwear_needed: boolean;
  sun_protection_neede: boolean;
  rain: boolean;
  snow: boolean;
  strong_wind: boolean;
}

/** 单日穿搭方案（OutfitPlanner 输出） */
export interface DailyOutfit {
  date: string;
  city: string;
  weather: string;
  temperature: string;
  feeling: string;
  top: string; // 上衣
  bottom: string; // 下装
  shoes: string; // 鞋子
  outerwear: string; // 外套，无则"无"
  accessories: string; // 配饰，无则"无"
  reminder: string; // 温馨提示
  image_url?: string; // 可展示的临时图片 URL
  reasoning_content?: string; // 穿搭核心理由
}

/** 一次完整行程的穿搭策略 */
export interface OutfitPlan {
  _id?: string; // 云数据库 id
  openid?: string;
  destination: CityInfo; // 目的地
  start_date: string;
  end_date: string;
  style_preference: string; // 主风格
  color_preference?: string;
  occasion?: string;
  avoid_items?: string;
  daily_list: DailyOutfit[]; // 每天穿搭
  created_at: number; // 创建时间戳
  updated_at: number;
}

/** 风格选项 */
export const STYLE_OPTIONS = [
  { key: 'minimal', label: '简约大气', desc: '极简色系，高级质感' },
  { key: 'european', label: '欧洲贵族', desc: '剪裁精良，优雅复古' },
  { key: 'kpop', label: '韩国女团', desc: '甜酷辣妹，舞台感' },
  { key: 'japanese', label: '日系风', desc: '森系温柔，松弛感' }
] as const;

export type StyleKey = typeof STYLE_OPTIONS[number]['key'];

/** Banner 项 */
export interface BannerItem {
  id: string;
  image: string;
  title?: string;
  desc?: string;
  buttonText?: string;
  action?: string; // 跳转路径
}

/** 登录态用户 */
export interface UserInfo {
  openid: string;
  nickName: string;
  avatarUrl: string;
  created_at: number;
}

export interface WorkflowGenerateRequest {
  workflow_id: '7680787686953058346';
  parameters: {
    city: string;
    province: string;
    towns: string;
    villages: string;
    start_time: string;
    end_time: string;
    style_preference?: string;
    color_preference?: string;
    avoid_items?: string;
    occasion?: string;
  };
}

export type WorkflowEventName = 'Message' | 'Error' | 'Interrupt' | 'PING' | 'Done';

export interface WorkflowStreamEvent {
  id?: number;
  event: WorkflowEventName;
  data: Record<string, unknown>;
}

export interface WorkflowResultPayload {
  date_list: string[];
  image_url_list: Array<string | {
    image_url?: string;
    reasoning_content?: string;
  }>;
  output_list: Array<Partial<DailyOutfit> & Pick<DailyOutfit, 'date' | 'city'>>;
}
