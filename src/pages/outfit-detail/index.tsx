import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import styles from './index.module.scss';
import NavBar from '@/components/NavBar';
import EmptyState from '@/components/EmptyState';
import { OUTFIT_PLAN_LIST } from '@/data/outfitList';
import { useAppStore } from '@/store/useAppStore';
import type { DailyOutfit, OutfitPlan } from '@/types';
import OutfitCard from '@/components/OutfitCard';

const WEEK_ZH = ['日', '一', '二', '三', '四', '五', '六'];

function formatDateShort(s: string) {
  if (!s) return '';
  const [, m, d] = s.split('-');
  return `${m}/${d}`;
}

const OutfitDetailPage: React.FC = () => {
  const router = useRouter();
  const { draftDailyList } = useAppStore();
  const [plan, setPlan] = useState<OutfitPlan | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  const params = router.params || {};
  const id = params.id;
  const date = params.date;

  useEffect(() => {
    let p: OutfitPlan | undefined;
    if (id) {
      p = OUTFIT_PLAN_LIST.find((x) => x._id === id);
    }
    if (!p && draftDailyList.length) {
      // fallback: 草稿模式（从 plan 流程进来）
      p = {
        _id: 'draft',
        destination: {
          province: '吉林',
          city: '延边朝鲜族自治州',
          district: '延吉市',
          fullName: '吉林 延边朝鲜族自治州 延吉市'
        },
        start_date: draftDailyList[0]?.date || '',
        end_date: draftDailyList[draftDailyList.length - 1]?.date || '',
        style_preference: 'minimal',
        daily_list: draftDailyList,
        created_at: Date.now(),
        updated_at: Date.now()
      };
    }
    if (p) {
      setPlan(p);
      const idx = date ? p.daily_list.findIndex((d) => d.date === date) : 0;
      setActiveIdx(idx < 0 ? 0 : idx);
    }
  }, [id, date, draftDailyList]);

  const daily: DailyOutfit | null = useMemo(() => {
    if (!plan) return null;
    return plan.daily_list[activeIdx] || null;
  }, [plan, activeIdx]);

  const handleShare = () => {
    Taro.showShareMenu?.({ withShareTicket: true });
    Taro.showToast({ title: '分享功能开发中', icon: 'none' });
  };

  const handleSaveImg = () => {
    Taro.showToast({ title: '正在保存海报...', icon: 'loading', duration: 800 });
  };

  const handleCollect = () => {
    Taro.showToast({ title: '已收藏', icon: 'success' });
  };

  if (!plan || !daily) {
    return (
      <View className={styles.pageWrap}>
        <NavBar title="穿搭详情" showBack onBack={() => Taro.navigateBack().catch(() => undefined)} />
        <EmptyState title="穿搭方案不存在" desc="可能已被删除或未保存" />
      </View>
    );
  }

  const totalDays = plan.daily_list.length;
  const avgTemp = daily.temperature;
  const totalCities = new Set([plan.destination.city]).size;

  return (
    <ScrollView scrollY className={styles.pageWrap}>
      {/* Hero 头图 */}
      <View className={styles.heroSection}>
        <View className={styles.heroTitleRow}>
          <View>
            <Text className={styles.heroCity}>{plan.destination.fullName}</Text>
            <Text className={styles.heroDate}>
              {formatDateShort(plan.start_date)} ~ {formatDateShort(plan.end_date)} · {totalDays}天行程
            </Text>
          </View>
          <Text className={styles.heroBadge}>Day {activeIdx + 1}/{totalDays}</Text>
        </View>
        <View className={styles.heroStats}>
          <View className={styles.heroStat}>
            <Text className={styles.statValue}>{avgTemp}</Text>
            <Text className={styles.statLabel}>当日温度</Text>
          </View>
          <View className={styles.heroStat}>
            <Text className={styles.statValue}>{daily.feeling}</Text>
            <Text className={styles.statLabel}>体感</Text>
          </View>
          <View className={styles.heroStat}>
            <Text className={styles.statValue}>{daily.weather}</Text>
            <Text className={styles.statLabel}>天气</Text>
          </View>
          <View className={styles.heroStat}>
            <Text className={styles.statValue}>{totalCities}</Text>
            <Text className={styles.statLabel}>城市</Text>
          </View>
        </View>
      </View>

      {/* 日期 Tab */}
      <ScrollView scrollX className={styles.dayTabs}>
        {plan.daily_list.map((d, idx) => {
          const dateObj = new Date(d.date);
          return (
            <Button
              key={d.date}
              className={`${styles.dayTab} ${idx === activeIdx ? styles.dayTabActive : ''}`}
              onClick={() => setActiveIdx(idx)}
            >
              <Text className={styles.dayTabDate}>{formatDateShort(d.date)}</Text>
              <Text className={styles.dayTabWeek}>周{WEEK_ZH[dateObj.getDay()]}</Text>
              <Text className={styles.dayTabWeather}>{d.weather?.slice?.(0, 4) || ''}</Text>
            </Button>
          );
        })}
      </ScrollView>

      <View className={styles.contentSection}>
        <OutfitCard
          date={daily.date}
          destination={plan.destination.fullName}
          weather={daily.weather}
          temperature={daily.temperature}
          feeling={daily.feeling}
          daily={daily}
          isActiveDay
        />
        {/* 穿搭单品卡片 */}
        <View className={styles.card}>
          <View className={styles.cardTitleRow}>
            <Text className={styles.cardTitle}>今日穿搭单品</Text>
            <Text className={styles.cardTag}>{daily.reasoning_content || 'AI 推荐'}</Text>
          </View>
          <View className={styles.grid2}>
            <View className={styles.itemBox}>
              <Text className={styles.itemLabel}>上衣</Text>
              <Text className={styles.itemText}>{daily.top}</Text>
            </View>
            <View className={styles.itemBox}>
              <Text className={styles.itemLabel}>下装</Text>
              <Text className={styles.itemText}>{daily.bottom}</Text>
            </View>
            <View className={styles.itemBox}>
              <Text className={styles.itemLabel}>外套</Text>
              <Text className={styles.itemText}>{daily.outerwear}</Text>
            </View>
            <View className={styles.itemBox}>
              <Text className={styles.itemLabel}>鞋子</Text>
              <Text className={styles.itemText}>{daily.shoes}</Text>
            </View>
            <View className={styles.itemBox} style={{ gridColumn: 'span 2' }}>
              <Text className={styles.itemLabel}>配饰</Text>
              <Text className={styles.itemText}>{daily.accessories}</Text>
            </View>
          </View>

          {daily.reminder && (
            <View className={styles.reminderBox}>
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" style={{ flexShrink: 0 }}>
                <path d="M12 9V13M12 17H12.01" stroke="#FF8A3D" strokeWidth="2" strokeLinecap="round"/>
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3H20.47a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0Z" stroke="#FF8A3D" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
              <Text className={styles.reminderText}>{daily.reminder}</Text>
            </View>
          )}
        </View>

        {/* 穿搭理由 */}
        <View className={styles.card}>
          <View className={styles.cardTitleRow}>
            <Text className={styles.cardTitle}>AI 穿搭解码</Text>
            <Text className={styles.cardTag}>天气 × 地域 × 风格</Text>
          </View>

          <View className={styles.itemBox} style={{ marginBottom: 16 }}>
            <Text className={styles.itemLabel}>穿搭核心理由</Text>
            <Text className={styles.itemText}>{daily.reasoning_content || '结合当日天气和风格，兼顾舒适与上镜'}</Text>
          </View>

        </View>
      </View>

      {/* 底部操作 */}
      <View className={styles.bottomBar}>
        <Button className={styles.ghostBtn} onClick={handleCollect}>
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none">
            <path
              d="M12 21L10.2 19.4C5.4 15.06 2.4 12.36 2.4 9C2.4 6.22 4.6 4 7.4 4C8.92 4 10.4 4.72 11.3 5.9L12 6.8L12.7 5.9C13.6 4.72 15.08 4 16.6 4C19.4 4 21.6 6.22 21.6 9C21.6 12.36 18.6 15.06 13.8 19.4L12 21Z"
              stroke="#2BA471"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </Button>
        <Button className={styles.shareBtn} onClick={handleShare}>
          分享
        </Button>
        <Button className={styles.primaryBtn} onClick={handleSaveImg}>
          保存穿搭海报
        </Button>
      </View>
    </ScrollView>
  );
};

export default OutfitDetailPage;
