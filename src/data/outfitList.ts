import type { DailyOutfit, OutfitPlan } from '@/types';

const now = Date.now();
const day = 86400000;

const d1: DailyOutfit = {
  date: '2026-09-02',
  city: '延边朝鲜族自治州',
  weather: '晴，白天晴',
  temperature: '12℃~24℃',
  feeling: '舒适',
  top: '奶白色朝鲜族小刺绣薄款纯棉长袖打底衫',
  bottom: '藏青色高腰直筒九分休闲裤',
  shoes: '白色厚底牛皮小白鞋',
  outerwear: '浅卡其色短款薄款棉麻西装外套',
  accessories: '黑色方框墨镜+米白色大容量帆布托特包',
  reminder: '昼夜温差较大可适时增减衣物，晴天紫外线强，记得涂防晒霜做好防晒',
  image_url:
    'Korean fashion street style full body shot of fashionable young woman, wearing off-white ethnic embroidered long-sleeve top, light khaki cropped linen blazer, navy high-waist cropped pants, white platform leather sneakers, black square sunglasses, beige canvas tote, natural sunlight, sharp focus, 8k high quality',
  reasoning_content: '韩系休闲舒适适配温差'
};

const d2: DailyOutfit = {
  date: '2026-09-03',
  city: '延边朝鲜族自治州',
  weather: '多云，白天多云',
  temperature: '11℃~24℃',
  feeling: '偏凉',
  top: '奶白色薄款纯棉长袖打底衫',
  bottom: '浅棕色高腰直筒九分牛仔裤',
  shoes: '棕色复古方头乐福鞋',
  outerwear: '卡其色短款工装薄外套',
  accessories: '黑色方框墨镜+棕色皮质腋下包',
  reminder: '紫外线较强，请涂抹好防晒霜，随身携带墨镜做好防晒',
  image_url:
    'Korean fashion street style full body shot of young Asian woman, wearing cream thin cotton long-sleeve top, light brown high-waist cropped straight jeans, khaki short work jacket, brown square-toe loafers, black square sunglasses, brown leather underarm bag, natural sunlight, sharp focus, 8k high quality',
  reasoning_content: '韩系休闲舒适日常穿搭'
};

const d3: DailyOutfit = {
  date: '2026-09-04',
  city: '延边朝鲜族自治州',
  weather: '晴，白天晴',
  temperature: '12℃~26℃',
  feeling: '舒适',
  top: '米白色朝鲜族小刺绣薄款棉长袖上衣',
  bottom: '卡其色高腰直筒九分休闲裤',
  shoes: '白色复古阿甘鞋',
  outerwear: '浅卡其色短款薄针织开衫',
  accessories: '黑色细框墨镜+米白色帆布斜挎包',
  reminder: '早晚温差较大，记得携带外套，外出佩戴墨镜做好防晒',
  image_url:
    'Korean fashion street style full body shot of young Asian woman, wearing off-white Korean-embroidered thin cotton long-sleeve top, light khaki short thin knit cardigan, khaki high-waisted straight ankle-length casual pants, white retro sneakers, black thin-rimmed sunglasses, off-white canvas crossbody bag, natural sunlight, sharp focus, 8k high quality',
  reasoning_content: '韩系舒适休闲通勤风'
};

const d4: DailyOutfit = {
  date: '2026-09-05',
  city: '延边朝鲜族自治州',
  weather: '晴，白天晴',
  temperature: '13℃~26℃',
  feeling: '舒适',
  top: '米白色薄款纯棉长袖T恤',
  bottom: '藏青色高腰直筒九分牛仔裤',
  shoes: '白色厚底老爹鞋',
  outerwear: '浅卡其色朝鲜族刺绣短款薄外套',
  accessories: '黑色方框墨镜+米色刺绣帆布斜挎包',
  reminder: '白天紫外线较强，请记得涂抹防晒霜，佩戴墨镜做好防晒',
  image_url:
    'Korean fashion street style full body shot of young lady, wearing off-white thin cotton long-sleeve tee, light khaki ethnic embroidered short thin jacket, navy high-waist cropped straight jeans, white chunky dad shoes, black square sunglasses, beige embroidered canvas crossbody bag, natural sunlight, sharp focus, 8k high quality',
  reasoning_content: '韩系休闲，舒适兼顾防晒'
};

const japan1: DailyOutfit = {
  date: '2026-10-01',
  city: '京都市',
  weather: '小雨，白天小雨',
  temperature: '16℃~22℃',
  feeling: '舒适',
  top: '奶白色圆领宽松针织毛衣',
  bottom: '深棕色高腰格纹百褶中长裙',
  shoes: '棕色复古玛丽珍小皮鞋',
  outerwear: '深卡其色中长款风衣',
  accessories: '折叠雨伞+棕色复古格纹贝雷帽+焦糖色皮质斜挎小方包',
  reminder: '京都今日有小雨，随身携带折叠伞，地面湿滑注意脚下',
  image_url:
    'Japanese mori girl style full body shot of young woman in Kyoto autumn, cream oversized knit sweater, dark brown plaid pleated midi skirt, camel long trench coat, brown mary jane shoes, vintage beret, transparent umbrella, soft overcast aesthetic, 8k high quality',
  reasoning_content: '日系森系复古适配京都雨季'
};

export const OUTFIT_PLAN_LIST: OutfitPlan[] = [
  {
    _id: 'plan-001',
    destination: {
      province: '吉林',
      city: '延边朝鲜族自治州',
      district: '延吉市',
      fullName: '吉林 延边朝鲜族自治州 延吉市'
    },
    start_date: '2026-09-02',
    end_date: '2026-09-05',
    style_preference: 'minimal',
    color_preference: '大地色',
    occasion: '出游',
    avoid_items: '',
    daily_list: [d1, d2, d3, d4],
    created_at: now - 2 * day,
    updated_at: now - 2 * day
  },
  {
    _id: 'plan-002',
    destination: {
      province: '国外',
      city: '京都府',
      district: '京都市',
      fullName: '日本 京都府 京都市'
    },
    start_date: '2026-10-01',
    end_date: '2026-10-01',
    style_preference: 'japanese',
    color_preference: '莫兰迪',
    occasion: '约会',
    avoid_items: '不穿高跟鞋',
    daily_list: [japan1],
    created_at: now - 5 * day,
    updated_at: now - 5 * day
  },
  {
    _id: 'plan-003',
    destination: {
      province: '上海',
      city: '上海市',
      district: '黄浦区',
      fullName: '上海 上海市 黄浦区'
    },
    start_date: '2026-08-15',
    end_date: '2026-08-17',
    style_preference: 'european',
    color_preference: '黑白灰',
    occasion: '商务',
    avoid_items: '不穿短裤',
    daily_list: [
      {
        date: '2026-08-15',
        city: '上海',
        weather: '多云转晴',
        temperature: '26℃~33℃',
        feeling: '偏热',
        top: '黑色真丝吊带内搭+白色小香风短袖外套',
        bottom: '灰色高腰西装阔腿长裤',
        shoes: '黑色尖头低跟乐福鞋',
        outerwear: '无',
        accessories: '珍珠锁骨链+黑色链条小方包',
        reminder: '上海高温闷热，注意补水和防暑',
        reasoning_content: '欧洲贵族精致感适配商务场合'
      }
    ],
    created_at: now - 20 * day,
    updated_at: now - 20 * day
  }
];
