import React from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import type { OutfitPlan } from '@/types';

export interface OutfitMiniCardProps {
  plan: OutfitPlan;
  isLatest?: boolean;
}

const OutfitMiniCard: React.FC<OutfitMiniCardProps> = ({ plan, isLatest }) => {
  const destination = plan.destination.fullName;
  const dateRange = `${plan.start_date.slice(5)} ~ ${plan.end_date.slice(5)}`;
  const days = plan.daily_list.length;
  const firstImg = plan.daily_list[0]?.image_url
    || 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=500&q=76';
  const firstWeather = plan.daily_list[0]?.weather || '';
  const firstTemp = plan.daily_list[0]?.temperature || '';

  const handleClick = () => {
    Taro.navigateTo({
      url: `/pages/outfit-detail/index?id=${plan._id}`
    }).catch(console.error);
  };

  const createdStr = (() => {
    const d = new Date(plan.created_at);
    return `${d.getMonth() + 1}/${d.getDate()} 创建`;
  })();

  return (
    <View className={styles.card} onClick={handleClick}>
      <View className={styles.left}>
        <Image className={styles.thumb} src={firstImg} mode="aspectFill" />
        {isLatest && <View className={styles.latestBadge}>最新</View>}
      </View>
      <View className={styles.right}>
        <View className={styles.row1}>
          <Text className={styles.dest}>{destination}</Text>
          <Text className={styles.dateText}>{dateRange}</Text>
        </View>
        <View className={styles.row2}>
          <Text className={styles.weather}>{firstWeather}</Text>
          <Text className={styles.temp}>{firstTemp}</Text>
          <Text className={styles.dayBadge}>{days}天穿搭</Text>
        </View>
        <View className={styles.row3}>
          <View className={styles.outfitPreview}>
            {plan.daily_list.slice(0, 3).map((d, i) => (
              <Text key={i} className={styles.outfitTag}>
                {d.top.slice(0, 6)}
              </Text>
            ))}
          </View>
          <Text className={styles.createTime}>{createdStr}</Text>
        </View>
      </View>
    </View>
  );
};

export default OutfitMiniCard;
