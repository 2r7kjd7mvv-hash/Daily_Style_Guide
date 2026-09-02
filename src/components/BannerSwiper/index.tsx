import React from 'react';
import { View, Text, Swiper, SwiperItem, Image, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import type { BannerItem } from '@/types';

export interface BannerSwiperProps {
  list: BannerItem[];
  autoPlay?: boolean;
  height?: string;
}

const BannerSwiper: React.FC<BannerSwiperProps> = ({ list, autoPlay = true, height = '380rpx' }) => {
  const handleClick = (item: BannerItem) => {
    console.log('[Banner] clicked:', item.id, item.action);
    if (item.action) {
      if (item.action.startsWith('tab:')) {
        Taro.switchTab({ url: item.action.replace('tab:', '') }).catch(console.error);
      } else {
        const url = item.action;
        Taro.navigateTo({ url }).catch((e) => {
          console.warn('[Banner] navigate fail, try switchTab:', e);
          Taro.switchTab({ url }).catch(console.error);
        });
      }
    }
  };

  return (
    <View className={styles.wrap}>
      <Swiper
        className={styles.swiper}
        indicatorDots
        indicatorColor="rgba(255,255,255,0.5)"
        indicatorActiveColor="#FFFFFF"
        autoplay={autoPlay}
        circular
        interval={4000}
        style={{ height }}
      >
        {list.map((item, idx) => (
          <SwiperItem key={item.id} onClick={() => handleClick(item)}>
            <View className={styles.slide}>
              <Image
                className={styles.bg}
                src={item.image}
                mode="aspectFill"
                lazyLoad
              />
              <View className={styles.overlay} />
              <View className={styles.content}>
                {(item.title || item.desc) && (
                  <View className={styles.textContent}>
                    {item.title && (
                      <Text className={styles.title}>{item.title}</Text>
                    )}
                    {item.desc && (
                      <Text className={styles.desc}>{item.desc}</Text>
                    )}
                  </View>
                )}
                {item.buttonText && idx === 0 && (
                  <Button className={styles.ctaBtn} onClick={(e) => { e.stopPropagation?.(); handleClick(item); }}>
                    {item.buttonText}
                  </Button>
                )}
              </View>
            </View>
          </SwiperItem>
        ))}
      </Swiper>
    </View>
  );
};

export default BannerSwiper;
