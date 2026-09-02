import React from 'react';
import { View } from '@tarojs/components';
import styles from './index.module.scss';

export interface LoadingSkeletonProps {
  variant?: 'card' | 'list' | 'page';
  count?: number;
}

const OutfitSkeleton: React.FC = () => (
  <View className={styles.outfitSkeleton}>
    <View className={styles.row}>
      <View className={`${styles.shimmer} ${styles.tag}`} />
      <View className={`${styles.shimmer} ${styles.tagSm}`} />
    </View>
    <View className={styles.contentRow}>
      <View className={`${styles.shimmer} ${styles.thumb}`} />
      <View className={styles.infoCol}>
        <View className={`${styles.shimmer} ${styles.line}`} />
        <View className={`${styles.shimmer} ${styles.lineSm}`} />
        <View className={`${styles.shimmer} ${styles.lineSm}`} />
        <View className={`${styles.shimmer} ${styles.lineXs}`} />
      </View>
    </View>
  </View>
);

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  variant = 'card',
  count = 3
}) => {
  if (variant === 'card') {
    return (
      <View className={styles.wrap}>
        {Array.from({ length: count }).map((_, i) => (
          <OutfitSkeleton key={i} />
        ))}
      </View>
    );
  }
  if (variant === 'list') {
    return (
      <View className={styles.wrap}>
        {Array.from({ length: count }).map((_, i) => (
          <View className={styles.listItemSkeleton} key={i}>
            <View className={`${styles.shimmer} ${styles.thumbSm}`} />
            <View style={{ flex: 1 }}>
              <View className={`${styles.shimmer} ${styles.line}`} />
              <View className={`${styles.shimmer} ${styles.lineSm}`} />
              <View className={`${styles.shimmer} ${styles.lineXs}`} />
            </View>
          </View>
        ))}
      </View>
    );
  }
  return (
    <View className={styles.wrap}>
      <View className={`${styles.shimmer} ${styles.banner}`} />
      <OutfitSkeleton />
      <OutfitSkeleton />
    </View>
  );
};

export default LoadingSkeleton;
