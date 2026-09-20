import type { FC } from 'react';
import { Button, Text, View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { MotionSurface } from '@/components/MotionSurface';
import styles from './index.module.scss';

const HomePage: FC = () => {
  const goPlan = () => Taro.navigateTo({ url: '/pages/plan/index' }).catch(() => undefined);
  return (
    <View className={styles.page}>
      <View className={`${styles.fabric} ${styles.fabricTop}`} />
      <View className={`${styles.fabric} ${styles.fabricBottom}`} />
      <View className={styles.historyEntry}>历史方案</View>
      <MotionSurface>
        <View className={styles.hero}>
          <Text className={styles.eyebrow}>DAILY STYLE GUIDE</Text>
          <Text className={styles.title}>你的专属出行穿搭助手</Text>
          <Text className={styles.subtitle}>从天气到风格，为每一段旅程轻盈准备</Text>
          <Button className={styles.primaryCta} onClick={goPlan}>开始设计我的出行穿搭</Button>
          <Text className={styles.note}>天气 × 地域 × 个人偏好</Text>
        </View>
      </MotionSurface>
    </View>
  );
};
export default HomePage;
