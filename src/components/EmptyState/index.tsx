import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  desc?: string;
  actionText?: string;
  onAction?: () => void;
  secondaryActionText?: string;
  onSecondaryAction?: () => void;
  compact?: boolean;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title = '暂无数据',
  desc = '这里暂时还没有内容',
  actionText,
  onAction,
  secondaryActionText,
  onSecondaryAction,
  compact = false,
}) => {
  return (
    <View className={`${styles.wrap} ${compact ? styles.compact : ''}`}>
      <View className={styles.iconBox}>
        {icon || (
          <svg viewBox="0 0 120 92" width="150" height="116" fill="none">
            <path d="M18 69C30 55 39 75 52 61C67 45 78 68 102 47" stroke="#B9D8D0" strokeWidth="3" strokeLinecap="round"/>
            <path d="M32 25H83C88 25 92 29 92 34V64C92 69 88 73 83 73H32C27 73 23 69 23 64V34C23 29 27 25 32 25Z" fill="#DDF1EB" stroke="#247C6D" strokeWidth="2.5"/>
            <path d="M41 25V18C41 14 44 11 48 11H68C72 11 75 14 75 18V25" stroke="#247C6D" strokeWidth="2.5"/>
            <path d="M23 43H92M43 43V73M72 43V73" stroke="#68A99B" strokeWidth="2" strokeDasharray="4 4"/>
            <circle cx="101" cy="24" r="8" fill="#F28C6B" opacity=".85"/>
          </svg>
        )}
      </View>
      <Text className={styles.title}>{title}</Text>
      <Text className={styles.desc}>{desc}</Text>
      {actionText && (
        <View className={styles.actionBtn} onClick={onAction}>
          <Text className={styles.actionText}>{actionText}</Text>
        </View>
      )}
      {secondaryActionText && (
        <View className={styles.secondaryBtn} onClick={onSecondaryAction}>
          <Text>{secondaryActionText}</Text>
        </View>
      )}
    </View>
  );
};

export default EmptyState;
