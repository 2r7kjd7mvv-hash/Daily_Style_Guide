import React, { useEffect, useState } from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import type { DailyOutfit } from '@/types';

export interface OutfitCardProps {
  planId?: string;
  date: string;
  destination?: string;
  weather?: string;
  temperature?: string;
  feeling?: string;
  daily: DailyOutfit;
  showDateTag?: boolean;
  isActiveDay?: boolean;
  onClick?: () => void;
}

const OutfitCard: React.FC<OutfitCardProps> = ({
  planId,
  date,
  destination,
  weather,
  temperature,
  feeling,
  daily,
  showDateTag = true,
  isActiveDay = false,
  onClick
}) => {
  const [imageFailed, setImageFailed] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  useEffect(() => {
    setImageFailed(false);
    setImageLoaded(false);
  }, [daily.image_url]);

  const previewImage = (event: { stopPropagation: () => void }) => {
    event.stopPropagation();
    if (!daily.image_url || imageFailed) return;
    Taro.previewImage({ current: daily.image_url, urls: [daily.image_url] }).catch(console.error);
  };
  const handleClick = () => {
    if (onClick) return onClick();
    if (planId) {
      Taro.navigateTo({
        url: `/pages/outfit-detail/index?id=${planId}&date=${date}`
      }).catch(console.error);
    }
  };

  return (
    <View
      className={`${styles.card} ${isActiveDay ? styles.activeCard : ''}`}
      onClick={handleClick}
    >
      <View className={styles.header}>
        <View className={styles.left}>
          {showDateTag && (
            <View className={`${styles.dateTag} ${isActiveDay ? styles.activeTag : ''}`}>
              <Text className={styles.dateText}>
                {date} {isActiveDay && '· 今日'}
              </Text>
            </View>
          )}
          {destination && (
            <Text className={styles.dest}>{destination}</Text>
          )}
        </View>
        {(weather || temperature) && (
          <View className={styles.weatherBox}>
            {weather && <Text className={styles.weather}>{weather}</Text>}
            {temperature && <Text className={styles.temp}>{temperature}</Text>}
          </View>
        )}
      </View>

      <View className={styles.body}>
        <View className={styles.imgCol} onClick={previewImage}>
          {daily.image_url && !imageFailed ? (
            <>
              {!imageLoaded && <View className={styles.imageSkeleton} />}
              <Image
                className={`${styles.img} ${imageLoaded ? styles.imageVisible : ''}`}
                src={daily.image_url}
                mode="aspectFill"
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageFailed(true)}
              />
              {imageLoaded && <View className={styles.previewTag}>点击查看</View>}
            </>
          ) : (
            <View className={styles.strategyFallback}>
              <Text className={styles.fallbackEyebrow}>穿搭策略</Text>
              <Text className={styles.fallbackTitle}>{daily.city || destination || '旅行穿搭'}</Text>
              <View className={styles.fallbackLine} />
              <Text className={styles.fallbackItem}>{daily.top || '舒适上装'}</Text>
              <Text className={styles.fallbackItem}>{daily.bottom || '轻松下装'}</Text>
              <Text className={styles.fallbackHint}>完整方案可继续查看</Text>
            </View>
          )}
          {isActiveDay && <View className={styles.starTag}>明星同款解码</View>}
        </View>

        <View className={styles.infoCol}>
          <View className={styles.itemRow}>
            <View className={styles.itemLabel}>上衣</View>
            <Text className={styles.itemVal}>{daily.top || '暂无数据'}</Text>
          </View>
          <View className={styles.itemRow}>
            <View className={styles.itemLabel}>下装</View>
            <Text className={styles.itemVal}>{daily.bottom || '暂无数据'}</Text>
          </View>
          <View className={styles.itemRow}>
            <View className={styles.itemLabel}>外套</View>
            <Text className={styles.itemVal}>{daily.outerwear || '暂无数据'}</Text>
          </View>
          <View className={styles.itemRow}>
            <View className={styles.itemLabel}>鞋子</View>
            <Text className={styles.itemVal}>{daily.shoes || '暂无数据'}</Text>
          </View>
          <View className={styles.itemRow}>
            <View className={styles.itemLabel}>配饰</View>
            <Text className={styles.itemVal}>{daily.accessories || '暂无数据'}</Text>
          </View>
          {feeling && (
            <View className={styles.feelingTag}>
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#2BA471" strokeWidth="1.5"/>
                <path d="M8 14C8 14 9.5 16 12 16C14.5 16 16 14 16 14" stroke="#2BA471" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="9" cy="10" r="1" fill="#2BA471"/>
                <circle cx="15" cy="10" r="1" fill="#2BA471"/>
              </svg>
              <Text className={styles.feelingText}>体感 {feeling}</Text>
            </View>
          )}
        </View>
      </View>

      {daily.reminder && (
        <View className={styles.reminderBox}>
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none">
            <path d="M12 9V13M12 17H12.01" stroke="#FF8A3D" strokeWidth="2" strokeLinecap="round"/>
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3H20.47a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0Z" stroke="#FF8A3D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <Text className={styles.reminderText}>{daily.reminder}</Text>
        </View>
      )}

      {daily.reasoning_content && (
        <View className={styles.reasonBox}>
          <Text className={styles.reasonLabel}>穿搭理由</Text>
          <Text className={styles.reasonText}>{daily.reasoning_content}</Text>
        </View>
      )}
    </View>
  );
};

export default OutfitCard;
