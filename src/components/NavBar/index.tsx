import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';

export interface NavBarProps {
  title?: string;
  showBack?: boolean;
  rightSlot?: React.ReactNode;
  bgWhite?: boolean;
  onBack?: () => void;
}

const NavBar: React.FC<NavBarProps> = ({
  title = '',
  showBack = false,
  rightSlot,
  bgWhite = true,
  onBack
}) => {
  return (
    <View className={`${styles.navWrap} ${bgWhite ? styles.bgWhite : ''}`}>
      <View className={styles.navInner}>
        <View className={styles.leftSlot}>
          {showBack && (
            <View className={styles.backBtn} onClick={onBack}>
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none">
                <path
                  d="M15 18L9 12L15 6"
                  stroke="#1F2A37"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </View>
          )}
        </View>
        <View className={styles.title}>
          <Text className={styles.titleText}>{title}</Text>
        </View>
        <View className={styles.rightSlot}>{rightSlot}</View>
      </View>
    </View>
  );
};

export default NavBar;
