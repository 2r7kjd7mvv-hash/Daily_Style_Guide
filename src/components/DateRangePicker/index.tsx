import React from 'react';
import { View, Text, Button, ScrollView, Picker } from '@tarojs/components';
import styles from './index.module.scss';

interface DateRangePickerProps {
  startDate: string; // YYYY-MM-DD
  endDate: string;
  onChange?: (start: string, end: string) => void;
  minDate?: string;
  maxRangeDays?: number;
}

function format(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDays(dateStr: string, offset: number) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + offset);
  return format(d);
}

function diffDays(a: string, b: string) {
  const ms = new Date(b).getTime() - new Date(a).getTime();
  return Math.round(ms / 86400000);
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onChange,
  minDate,
  maxRangeDays = 15
}) => {
  const todayStr = minDate || format(new Date());

  const shortcuts = [
    { label: '3天2晚', days: 3 },
    { label: '5天4晚', days: 5 },
    { label: '7天6晚', days: 7 },
    { label: '国庆(7天)', days: 7 }
  ];

  const handleStartChange = (e: any) => {
    const s = e.detail.value;
    if (!s) return;
    if (s < todayStr) return;
    let en = endDate;
    if (en < s) en = addDays(s, 1);
    if (diffDays(s, en) > maxRangeDays) en = addDays(s, maxRangeDays);
    onChange?.(s, en);
  };

  const handleEndChange = (e: any) => {
    const en = e.detail.value;
    if (!en) return;
    if (en < startDate) return;
    if (diffDays(startDate, en) > maxRangeDays) {
      // 限制最大范围
      const clampedEnd = addDays(startDate, maxRangeDays);
      onChange?.(startDate, clampedEnd);
      return;
    }
    onChange?.(startDate, en);
  };

  const applyShortcut = (days: number) => {
    const s = startDate >= todayStr ? startDate : todayStr;
    onChange?.(s, addDays(s, days - 1));
  };

  const totalDays = diffDays(startDate, endDate) + 1;

  return (
    <View className={styles.wrap}>
      <Text className={styles.title}>选择旅行时间</Text>

      <View className={styles.shortcuts}>
        {shortcuts.map((s) => (
          <Button
            key={s.label}
            className={styles.shortcutBtn}
            onClick={() => applyShortcut(s.days)}
          >
            {s.label}
          </Button>
        ))}
      </View>

      <View className={styles.pickerRow}>
        <View className={styles.pickerCol}>
          <Text className={styles.label}>开始时间</Text>
          <Button
            className={styles.pickerBtn}
            onClick={() => {}}
          >
            <Text className={styles.dateText}>{startDate}</Text>
            <Text className={styles.weekText}>
              周{'日一二三四五六'[new Date(startDate).getDay()]}
            </Text>
            <Picker
              mode="date"
              value={startDate}
              start={todayStr}
              end={addDays(todayStr, 90)}
              onChange={handleStartChange}
              style={{ position: 'absolute', inset: 0, opacity: 0 }}
            >
              <View />
            </Picker>
          </Button>
        </View>
        <View className={styles.arrowCol}>
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none">
            <path d="M5 12H19M19 12L13 6M19 12L13 18" stroke="#2BA471" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </View>
        <View className={styles.pickerCol}>
          <Text className={styles.label}>结束时间</Text>
          <Button className={styles.pickerBtn}>
            <Text className={styles.dateText}>{endDate}</Text>
            <Text className={styles.weekText}>
              周{'日一二三四五六'[new Date(endDate).getDay()]}
            </Text>
            <Picker
              mode="date"
              value={endDate}
              start={startDate}
              end={addDays(startDate, maxRangeDays)}
              onChange={handleEndChange}
              style={{ position: 'absolute', inset: 0, opacity: 0 }}
            >
              <View />
            </Picker>
          </Button>
        </View>
      </View>

      <View className={styles.total}>
        <Text className={styles.totalLabel}>共</Text>
        <Text className={styles.totalNum}>{totalDays}</Text>
        <Text className={styles.totalLabel}>天 {totalDays - 1} 晚 · 生成 {totalDays} 套穿搭</Text>
      </View>

      <ScrollView scrollX className={styles.timeline}>
        {Array.from({ length: totalDays }).map((_, i) => {
          const d = addDays(startDate, i);
          return (
            <View key={d} className={styles.dayDot}>
              <View className={styles.dayDotTop}>{i === 0 ? '起' : i === totalDays - 1 ? '止' : i + 1}</View>
              <Text className={styles.dayDate}>{d.slice(5)}</Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default DateRangePicker;
