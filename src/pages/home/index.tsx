import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import styles from './index.module.scss';
import BannerSwiper from '@/components/BannerSwiper';
import OutfitCard from '@/components/OutfitCard';
import OutfitMiniCard from '@/components/OutfitMiniCard';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import EmptyState from '@/components/EmptyState';
import { BANNER_LIST, DEFAULT_CITY } from '@/data/banners';
import { getOutfitPlans, login } from '@/services/outfit';
import { useAppStore } from '@/store/useAppStore';
import type { OutfitPlan } from '@/types';

const HomePage: React.FC = () => {
  const { user, setUser, draftDestination, setDraftDestination } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<OutfitPlan[]>([]);

  const dest = draftDestination || DEFAULT_CITY;

  const greetingText = useMemo(() => {
    const h = new Date().getHours();
    if (h < 6) return '凌晨好';
    if (h < 12) return '早上好';
    if (h < 14) return '中午好';
    if (h < 18) return '下午好';
    return '晚上好';
  }, []);

  const latestPlan = plans[0];
  const latestDay = latestPlan?.daily_list?.[0];
  const otherPlans = plans.slice(1, 4);

  const init = async () => {
    setLoading(true);
    try {
      if (!user) {
        const u = await login();
        setUser(u);
      }
      const res = await getOutfitPlans({ page: 1, pageSize: 4 });
      setPlans(res.list || []);
    } catch (e) {
      console.error('init error', e);
    } finally {
      setLoading(false);
    }
  };

  useDidShow(() => {
    init();
  });

  useEffect(() => {
    init();
  }, []);

  const goCityPicker = () => {
    Taro.navigateTo({ url: '/pages/city-picker/index' }).catch(console.error);
  };

  const goPlan = () => {
    if (!draftDestination) {
      setDraftDestination(DEFAULT_CITY);
    }
    Taro.navigateTo({ url: '/pages/plan/index' }).catch(console.error);
  };

  const goOutfits = () => {
    Taro.switchTab({ url: '/pages/outfits/index' }).catch(console.error);
  };

  return (
    <ScrollView scrollY className={styles.pageWrap}>
      {/* 顶部栏 */}
      <View className={styles.topBar}>
        <Button className={styles.locationBtn} onClick={goCityPicker}>
          <View className={styles.locIcon}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
              <path d="M12 22C12 22 20 16 20 10C20 6.686 17.314 4 14 4C12.87 4 11.85 4.309 11.06 4.845C10.26 5.381 9.74 6.12 9.5 7L10 9H8L8.5 7C8.26 6.12 7.74 5.381 6.94 4.845C6.15 4.309 5.13 4 4 4C0.686 4 -2 6.686 -2 10C-2 16 6 22 12 22Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="10" r="2.5" stroke="white" strokeWidth="1.5"/>
            </svg>
          </View>
          <Text className={styles.locText}>{dest.fullName}</Text>
          <svg className={styles.locArrow} viewBox="0 0 24 24" width="16" height="16" fill="none">
            <path d="M6 9L12 15L18 9" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Button>
        <View className={styles.actionIcons}>
          <View className={styles.iconBtn} onClick={goOutfits}>
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none">
              <path d="M21 21L16.65 16.65" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="11" cy="11" r="7" stroke="#4B5563" strokeWidth="2"/>
            </svg>
          </View>
          <View className={styles.iconBtn} onClick={() => Taro.showToast({ title: '消息功能开发中', icon: 'none' })}>
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M13.73 21a2 2 0 01-3.46 0" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </View>
        </View>
      </View>

      <View className={styles.sectionWrap}>
        {/* 问候 */}
        <View className={styles.greetingBox}>
          <Text className={styles.greetingTitle}>
            {greetingText}{user?.nickName?.slice(0, 4) || '小仙女'} 👋
          </Text>
          <Text className={styles.greetingDesc}>
            今天 <Text className={styles.highlight}>{dest.city}</Text> 天气不错，
            让我们为你定制一套美美的旅行穿搭吧～
          </Text>
        </View>

        {/* Banner 轮播 */}
        <BannerSwiper list={BANNER_LIST} height="520rpx" />

        {/* 快捷入口 */}
        <View style={{ marginTop: 40 }}>
          <View className={styles.quickEntryRow}>
            <Button className={styles.entryItem} onClick={goPlan}>
              <View className={styles.entryIcon}>
                <svg viewBox="0 0 24 24" width="30" height="30" fill="none">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="#2BA471" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </View>
              <Text className={styles.entryText}>设计穿搭</Text>
            </Button>
            <Button className={styles.entryItem} onClick={goOutfits}>
              <View className={styles.entryIcon}>
                <svg viewBox="0 0 24 24" width="30" height="30" fill="none">
                  <rect x="3" y="4" width="18" height="16" rx="3" stroke="#2BA471" strokeWidth="1.8"/>
                  <path d="M3 10H21" stroke="#2BA471" strokeWidth="1.8"/>
                  <path d="M8 4V10" stroke="#2BA471" strokeWidth="1.8"/>
                </svg>
              </View>
              <Text className={styles.entryText}>我的穿搭</Text>
            </Button>
            <Button className={styles.entryItem} onClick={() => Taro.switchTab({ url: '/pages/mine/index' }).catch(() => {})}>
              <View className={styles.entryIcon}>
                <svg viewBox="0 0 24 24" width="30" height="30" fill="none">
                  <circle cx="12" cy="8" r="4" stroke="#2BA471" strokeWidth="1.8"/>
                  <path d="M4 21C4 17.13 7.58 14 12 14C16.42 14 20 17.13 20 21" stroke="#2BA471" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              </View>
              <Text className={styles.entryText}>个人中心</Text>
            </Button>
            <Button className={styles.entryItem} onClick={goCityPicker}>
              <View className={styles.entryIcon}>
                <svg viewBox="0 0 24 24" width="30" height="30" fill="none">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="#FF8A3D" strokeWidth="1.8"/>
                  <circle cx="12" cy="10" r="3" stroke="#FF8A3D" strokeWidth="1.8"/>
                </svg>
              </View>
              <Text className={styles.entryText}>目的地</Text>
            </Button>
          </View>
        </View>

        {/* 最近穿搭 - 详细卡片 */}
        <View>
          <View className={styles.sectionHead}>
            <Text className={styles.sectionTitle}>最近穿搭</Text>
            <Button className={styles.moreBtn} onClick={goOutfits}>
              查看全部 ›
            </Button>
          </View>

          {loading ? (
            <LoadingSkeleton variant="card" count={1} />
          ) : !latestPlan || !latestDay ? (
            <EmptyState
              title="还没有穿搭记录"
              desc="快来定制你的第一套旅行穿搭策略吧"
              actionText="去设计穿搭"
              onAction={goPlan}
            />
          ) : (
            <View className={styles.latestCard}>
              <OutfitCard
                planId={latestPlan._id}
                date={latestDay.date}
                destination={latestPlan.destination.fullName}
                weather={latestDay.weather}
                temperature={latestDay.temperature}
                feeling={latestDay.feeling}
                daily={latestDay}
                showDateTag
                isActiveDay
              />
            </View>
          )}
        </View>

        {/* 其他历史 */}
        {!loading && otherPlans.length > 0 && (
          <View style={{ marginTop: 40 }}>
            <View className={styles.sectionHead}>
              <Text className={styles.sectionTitle}>历史行程</Text>
            </View>
            {otherPlans.map((p) => (
              <OutfitMiniCard key={p._id!} plan={p} />
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default HomePage;
