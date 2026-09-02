import React from 'react';
import { View, Text, Button } from '@tarojs/components';
import styles from './index.module.scss';
import { STYLE_OPTIONS } from '@/types';
import type { StyleKey } from '@/types';

export interface StylePickerProps {
  value: string;
  onChange?: (key: string) => void;
  disabled?: boolean;
}

const StylePicker: React.FC<StylePickerProps> = ({ value, onChange, disabled = false }) => {
  return (
    <View className={styles.wrap}>
      <Text className={styles.title}>选择我的风格</Text>
      <View className={styles.grid}>
        {STYLE_OPTIONS.map((opt) => {
          const active = value === opt.key;
          return (
            <Button
              key={opt.key}
              className={`${styles.item} ${active ? styles.itemActive : ''} ${disabled ? styles.disabled : ''}`}
              onClick={() => !disabled && onChange?.(opt.key as StyleKey | string)}
            >
              <View className={styles.itemHead}>
                <Text className={styles.label}>{opt.label}</Text>
                {active && (
                  <View className={styles.check}>
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
                      <path d="M5 12L10 17L19 8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </View>
                )}
              </View>
              <Text className={styles.desc}>{opt.desc}</Text>
            </Button>
          );
        })}
      </View>
    </View>
  );
};

export default StylePicker;
