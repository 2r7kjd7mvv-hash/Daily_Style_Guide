import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Button, Input } from '@tarojs/components';
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro';
import styles from './index.module.scss';
import NavBar from '@/components/NavBar';
import OutfitCard from '@/components/OutfitCard';
import OutfitMiniCard from '@/components/OutfitMiniCard';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import EmptyState from '@/components/EmptyState';
import { getOutfitPlans } from '@/services/outfit';
import type { OutfitPlan } from '@/types';

function formatDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const OCCASION_OPTIONS = ['全部', '日常通勤', '校园', '约会', '出游', '商务'];
const STYLE_OPTIONS = ['全部', '简约大气', '欧洲贵族', '韩国女团', '日系风'];
const SORT_OPTIONS = [
  { key: 'time_desc', label: '创建时间倒序' },
  { key: 'time_asc', label: '创建时间正序' },
  { key: 'trip_desc', label: '出行时间倒序' },
  { key: 'trip_asc', label: '出行时间正序' }
];

const OutfitsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<OutfitPlan[]>([]);
  const [keyword, setKeyword] = useState('');
  const [searchText, setSearchText] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [occasion, setOccasion] = useState('全部');
  const [styleKey, setStyleKey] = useState('全部');
  const [sortKey, setSortKey] = useState('time_desc');
  const [tripStart, setTripStart] = useState('');
  const [tripEnd, setTripEnd] = useState('');
  const [total, setTotal] = useState(0);

  const todayStr = formatDate(new Date());

  const latestPlan = useMemo(() => {
    // 找到包含今日或最近出行时间的行程
    const withToday = plans.find(
      (p) => p.start_date <= todayStr && p.end_date >= todayStr
    );
    return withToday || plans[0];
  }, [plans, todayStr]);

  const activeDay = useMemo(() => {
    if (!latestPlan) return null;
    // 如果在行程中，显示当天穿搭；否则显示第一天穿搭
    const day =
      latestPlan.daily_list.find((d) => d.date === todayStr) ||
      latestPlan.daily_list[0];
    return day || null;
  }, [latestPlan, todayStr]);

  const otherPlans = useMemo(() => {
    if (!latestPlan) return plans;
    return plans.filter((p) => p._id !== latestPlan._id);
  }, [plans, latestPlan]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getOutfitPlans({
        destination_keyword: searchText || undefined,
        start_date_from: tripStart || undefined,
        start_date_to: tripEnd || undefined,
        page: 1,
        pageSize: 50
      });
      let list = res.list || [];
      // 本地额外过滤（模拟服务端没实现的筛选）
      if (occasion !== '全部') {
        list = list.filter((p) => !p.occasion || p.occasion === occasion);
      }
      if (styleKey !== '全部') {
        list = list.filter(
          (p) =>
            !p.style_preference ||
            ['简约大气', '欧洲贵族', '韩国女团', '日系风'][
              ['minimal', 'european', 'kpop', 'japanese'].indexOf(p.style_preference)
            ] === styleKey
        );
      }
      list = [...list].sort((a, b) => {
        switch (sortKey) {
          case 'time_asc':
            return a.created_at - b.created_at;
          case 'trip_desc':
            return b.start_date.localeCompare(a.start_date);
          case 'trip_asc':
            return a.start_date.localeCompare(b.start_date);
          case 'time_desc':
          default:
            return b.created_at - a.created_at;
        }
      });
      setPlans(list);
      setTotal(list.length);
    } catch (e) {
      console.error('fetch error', e);
    } finally {
      setLoading(false);
      Taro.stopPullDownRefresh();
    }
  };

  useDidShow(() => {
    fetchData();
  });

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText, sortKey, occasion, styleKey, tripStart, tripEnd]);

  usePullDownRefresh(() => {
    fetchData();
  });

  const onSearch = () => {
    setSearchText(keyword.trim());
  };

  const goPlan = () => {
    Taro.navigateTo({ url: '/pages/plan/index' }).catch(console.error);
  };

  const resetFilter = () => {
    setOccasion('全部');
    setStyleKey('全部');
    setTripStart('');
    setTripEnd('');
    setSortKey('time_desc');
  };

  return (
    <View className={styles.pageWrap}>
      <NavBar title="我的穿搭" />

      {/* 搜索区 */}
      <View className={styles.searchSection}>
        <View className={styles.searchRow}>
          <View className={styles.searchBar}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
              <path
                d="M21 21L16.65 16.65"
                stroke="#9CA3AF"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle cx="11" cy="11" r="7" stroke="#9CA3AF" strokeWidth="2" />
            </svg>
            <Input
              className={styles.searchInput}
              placeholder="搜索目的地城市"
              placeholderClass={styles.searchPlace}
              value={keyword}
              onInput={(e) => setKeyword(e.detail.value)}
              onConfirm={onSearch}
              confirmType="search"
            />
          </View>
          <View
            className={`${styles.filterBtn} ${showFilter ? 'active' : ''}`}
            onClick={() => setShowFilter((v) => !v)}
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
              <path
                d="M4 6H20M7 12H17M10 18H14"
                stroke={showFilter ? '#2BA471' : '#4B5563'}
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </View>
        </View>

        <View className={styles.chipRow}>
          <Button
            className={`${styles.chip} ${sortKey === 'time_desc' ? styles.chipActive : ''}`}
            onClick={() => setSortKey('time_desc')}
          >
            最近创建
          </Button>
          <Button
            className={`${styles.chip} ${sortKey === 'trip_desc' ? styles.chipActive : ''}`}
            onClick={() => setSortKey('trip_desc')}
          >
            出行时间
          </Button>
          <Button className={styles.chip} onClick={() => Taro.showToast({ title: '出行时间筛选见上方筛选', icon: 'none' })}>
            📅 {tripStart || '开始'} ~ {tripEnd || '结束'}
          </Button>
        </View>

        {showFilter && (
          <View className={styles.filterPanel}>
            <View className={styles.filterGroup}>
              <Text className={styles.filterLabel}>出行场景</Text>
              <View className={styles.filterChips}>
                {OCCASION_OPTIONS.map((o) => (
                  <Button
                    key={o}
                    className={`${styles.fChip} ${occasion === o ? styles.fChipActive : ''}`}
                    onClick={() => setOccasion(o)}
                  >
                    {o}
                  </Button>
                ))}
              </View>
            </View>
            <View className={styles.filterGroup}>
              <Text className={styles.filterLabel}>风格偏好</Text>
              <View className={styles.filterChips}>
                {STYLE_OPTIONS.map((s) => (
                  <Button
                    key={s}
                    className={`${styles.fChip} ${styleKey === s ? styles.fChipActive : ''}`}
                    onClick={() => setStyleKey(s)}
                  >
                    {s}
                  </Button>
                ))}
              </View>
            </View>
            <View className={styles.filterFoot}>
              <Button className={styles.resetBtn} onClick={resetFilter}>
                重置
              </Button>
              <Button className={styles.confirmBtn} onClick={() => setShowFilter(false)}>
                确认筛选
              </Button>
            </View>
          </View>
        )}
      </View>

      {/* 列表区 */}
      <View className={styles.listSection}>
        <View className={styles.sectionHead}>
          <Text className={styles.title}>
            穿搭列表
            <Text className={styles.subTitle}>{total > 0 ? `共 ${total} 套` : ''}</Text>
          </Text>
          <Button
            className={styles.sortBtn}
            onClick={() => {
              const idx = SORT_OPTIONS.findIndex((s) => s.key === sortKey);
              const next = SORT_OPTIONS[(idx + 1) % SORT_OPTIONS.length];
              setSortKey(next.key);
            }}
          >
            {SORT_OPTIONS.find((s) => s.key === sortKey)?.label}
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none">
              <path
                d="M7 10L12 15L17 10"
                stroke="#4B5563"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Button>
        </View>

        {loading ? (
          <LoadingSkeleton variant="card" count={2} />
        ) : plans.length === 0 ? (
          <EmptyState
            title="暂无穿搭记录"
            desc="试试换个搜索关键词，或设计你的第一套旅行穿搭"
            actionText="设计穿搭"
            onAction={goPlan}
          />
        ) : (
          <>
            {/* 详细大卡片 - 今日/最新行程 */}
            {latestPlan && activeDay && (
              <OutfitCard
                planId={latestPlan._id}
                date={activeDay.date}
                destination={latestPlan.destination.fullName}
                weather={activeDay.weather}
                temperature={activeDay.temperature}
                feeling={activeDay.feeling}
                daily={activeDay}
                isActiveDay={activeDay.date === todayStr}
              />
            )}

            {/* 其他行程小卡片 */}
            {otherPlans.map((p) => (
              <OutfitMiniCard key={p._id!} plan={p} />
            ))}
          </>
        )}
      </View>
    </View>
  );
};

export default OutfitsPage;
