import React from 'react';
import { Image, Text, View } from '@tarojs/components';
import type { DailyOutfit } from '@/types';
import styles from './index.module.scss';

const OutfitChecklist: React.FC<{ daily: DailyOutfit }> = ({ daily }) => {
  const items = [
    ['上衣', daily.top, '贴近肌肤，兼顾温度与整体色调'],
    ['下装', daily.bottom, '方便步行，在旅途中保持利落轮廓'],
    ['外套', daily.outerwear, '应对早晚温差，叠穿更从容'],
    ['鞋履', daily.shoes, '适合长时间行走，也能完成造型'],
    ['配饰', daily.accessories, '用轻量细节呼应目的地氛围'],
  ].filter(([, value]) => value && value !== '无');
  return (
    <View className={styles.wrap}>
      <Text className={styles.kicker}>PACKING LIST</Text>
      <Text className={styles.title}>把这一身放进行李箱</Text>
      {items.map(([label, value, reason], index) => (
        <View className={styles.item} key={label}>
          {daily.image_url ? <Image className={styles.thumb} src={daily.image_url} mode="aspectFill" style={{ objectPosition: `${50 + (index % 2) * 18}% ${30 + index * 12}%` }} /> : <View className={styles.thumbEmpty} />}
          <View className={styles.copy}>
            <Text className={styles.label}>{label}</Text>
            <Text className={styles.value}>{value}</Text>
            <Text className={styles.reason}>{reason}</Text>
          </View>
        </View>
      ))}
    </View>
  );
};

export default OutfitChecklist;
