import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import type { DailyOutfit } from '@/types';

export interface OutfitDayCarouselProps {
  dailyList: DailyOutfit[];
  destination?: string;
}

function isViewableImage(value?: string): value is string {
  return Boolean(value && /^(https?:\/\/|data:image\/)/i.test(value.trim()));
}

function parseDateLabel(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');
  if (!match) return value;
  const week = '日一二三四五六'[new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])).getDay()];
  return `${match[2]}/${match[3]} 周${week}`;
}

function needsRainGear(daily: DailyOutfit) {
  const text = [daily.weather, daily.reminder, daily.feeling].filter(Boolean).join(' ');
  return /雨|雪|伞|雨具|湿/.test(text);
}

interface DragState {
  startX: number;
  startY: number;
  delta: number;
  horizontal: boolean;
}

const SLIDE_WIDTH_PCT = 66; // 相对容器宽度
const BASE_PCT = (100 - SLIDE_WIDTH_PCT) / 2 / SLIDE_WIDTH_PCT * 100;
const STEP_PCT = (SLIDE_WIDTH_PCT + 3) / SLIDE_WIDTH_PCT * 100;

function translateFor(index: number, active: number, dragPx: number) {
  const pct = BASE_PCT + (index - active) * STEP_PCT;
  return dragPx ? `translateX(calc(${pct}% + ${dragPx}px))` : `translateX(${pct}%)`;
}

const OutfitDayCarousel: React.FC<OutfitDayCarouselProps> = ({ dailyList, destination }) => {
  const [active, setActive] = useState(0);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [broken, setBroken] = useState<Record<number, boolean>>({});

  const count = dailyList.length;
  const activeDaily = dailyList[Math.min(active, Math.max(0, count - 1))];

  useEffect(() => {
    setActive(0);
    setBroken({});
    setDrag(null);
  }, [dailyList]);

  const goTo = (next: number) => {
    if (count < 2) return;
    setActive(Math.max(0, Math.min(count - 1, next)));
  };

  const startDrag = (e: any) => {
    const touch = e.touches?.[0];
    if (count < 2 || !touch) return;
    setDrag({ startX: touch.clientX, startY: touch.clientY, delta: 0, horizontal: false });
  };

  const moveDrag = (e: any) => {
    if (!drag) return;
    const touch = e.touches?.[0];
    if (!touch) return;
    const dx = touch.clientX - drag.startX;
    const dy = touch.clientY - drag.startY;
    if (!drag.horizontal) {
      if (Math.abs(dx) <= 6) return;
      if (Math.abs(dy) > Math.abs(dx)) return; // 纵向滚动交给页面
      setDrag({ ...drag, delta: dx, horizontal: true });
      return;
    }
    setDrag({ ...drag, delta: dx });
  };

  const endDrag = () => {
    if (!drag || !drag.horizontal) {
      setDrag(null);
      return;
    }
    if (drag.delta < -46) goTo(active + 1);
    else if (drag.delta > 46) goTo(active - 1);
    setDrag(null);
  };

  const previewImage = (daily: DailyOutfit, index: number) => {
    const imageUrl = daily.image_url;
    if (broken[index] || !imageUrl || !isViewableImage(imageUrl)) return;
    Taro.previewImage({ current: imageUrl, urls: [imageUrl] }).catch(console.error);
  };

  const rainTag = useMemo(
    () => (activeDaily ? needsRainGear(activeDaily) : false),
    [activeDaily],
  );

  if (!activeDaily) return null;
  const dragging = Boolean(drag?.horizontal);
  const dragDelta = dragging ? drag!.delta : 0;

  return (
    <View className={styles.wrap}>
      <View className={styles.topBar}>
        <View className={styles.topLeft}>
          <Text className={styles.dayIndex}>DAY {active + 1}</Text>
          <Text className={styles.dayDate}>{parseDateLabel(activeDaily.date)}</Text>
        </View>
        <View className={styles.weatherGroup}>
          {activeDaily.weather && <Text className={styles.weatherText}>{activeDaily.weather}</Text>}
          {activeDaily.temperature && <Text className={styles.tempText}>{activeDaily.temperature}</Text>}
        </View>
      </View>

      <View
        className={styles.stage}
        onTouchStart={startDrag}
        onTouchMove={moveDrag}
        onTouchEnd={endDrag}
        onTouchCancel={endDrag}
      >
        {dailyList.map((daily, index) => {
          const imageUrl = daily.image_url;
          return (
            <View
              key={daily.date + index}
              className={`${styles.slide} ${index === active ? styles.slideActive : ''} ${dragging ? styles.noTransition : ''}`}
              style={{ transform: translateFor(index, active, dragDelta) }}
              onClick={() => index !== active && goTo(index)}
            >
              <View className={styles.imageWrap} onClick={() => previewImage(daily, index)}>
                {imageUrl && isViewableImage(imageUrl) && !broken[index] ? (
                  <Image
                    className={styles.image}
                    src={imageUrl}
                    mode="aspectFill"
                    onError={() => setBroken((prev) => ({ ...prev, [index]: true }))}
                  />
                ) : (
                  <View className={styles.fallback}>
                    <Text className={styles.fallbackEyebrow}>穿搭策略</Text>
                    <Text className={styles.fallbackTitle}>{daily.city || destination || '旅行穿搭'}</Text>
                    <Text className={styles.fallbackItem}>{daily.top || '舒适上装'}</Text>
                    <Text className={styles.fallbackItem}>{daily.bottom || '轻松下装'}</Text>
                    <Text className={styles.fallbackHint}>参考图生成中或暂不可用</Text>
                  </View>
                )}
                <View className={styles.coverTag}>
                  <Text className={styles.coverTagText}>{daily.date ? parseDateLabel(daily.date) : ''}</Text>
                </View>
                {index === active && (
                  <View className={styles.likeTag}>
                    <Text className={styles.likeText}>今日参考</Text>
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </View>

      {count > 1 && (
        <View className={styles.navRow}>
          <View className={`${styles.navBtn} ${active === 0 ? styles.navDisabled : ''}`} onClick={() => goTo(active - 1)}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
              <path d="M15 6L9 12L15 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </View>
          <View className={styles.dots}>
            {dailyList.map((_, index) => (
              <View
                key={index}
                className={`${styles.dot} ${index === active ? styles.dotActive : ''}`}
                onClick={() => goTo(index)}
              />
            ))}
          </View>
          <View className={`${styles.navBtn} ${active === count - 1 ? styles.navDisabled : ''}`} onClick={() => goTo(active + 1)}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
              <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </View>
        </View>
      )}
      {count > 1 && (
        <Text className={styles.swipeHint}>左右滑动切换 · 正在查看第 {active + 1} / {count} 天</Text>
      )}

      <View className={styles.detailCard}>
        <View className={styles.detailHead}>
          <Text className={styles.detailTitle}>今日穿搭清单</Text>
          <View className={styles.tagRow}>
            {rainTag && <Text className={styles.rainTag}>☂ 建议携带雨具</Text>}
            {!rainTag && <Text className={styles.clearTag}>无需雨具</Text>}
            {activeDaily.feeling && <Text className={styles.feelingTag}>{activeDaily.feeling}</Text>}
          </View>
        </View>
        <View className={styles.itemRows}>
          <View className={styles.itemRow}>
            <Text className={styles.itemLabel}>上衣</Text>
            <Text className={styles.itemValue}>{activeDaily.top || '暂无数据'}</Text>
          </View>
          <View className={styles.itemRow}>
            <Text className={styles.itemLabel}>下装</Text>
            <Text className={styles.itemValue}>{activeDaily.bottom || '暂无数据'}</Text>
          </View>
          <View className={styles.itemRow}>
            <Text className={styles.itemLabel}>鞋履</Text>
            <Text className={styles.itemValue}>{activeDaily.shoes || '暂无数据'}</Text>
          </View>
          <View className={styles.itemRow}>
            <Text className={styles.itemLabel}>外套</Text>
            <Text className={styles.itemValue}>{activeDaily.outerwear && activeDaily.outerwear !== '无' ? activeDaily.outerwear : '无'}</Text>
          </View>
          <View className={styles.itemRow}>
            <Text className={styles.itemLabel}>配饰</Text>
            <Text className={styles.itemValue}>{activeDaily.accessories || '暂无数据'}</Text>
          </View>
        </View>
        {activeDaily.reminder && (
          <View className={styles.reminderRow}>
            <Text className={styles.reminderLabel}>提示</Text>
            <Text className={styles.reminderText}>{activeDaily.reminder}</Text>
          </View>
        )}
        {activeDaily.reasoning_content && (
          <View className={styles.reminderRow}>
            <Text className={styles.reminderLabel}>理由</Text>
            <Text className={styles.reminderText}>{activeDaily.reasoning_content}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default OutfitDayCarousel;
