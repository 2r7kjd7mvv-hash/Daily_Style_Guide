import React from 'react';
import { ScrollView, Text, View } from '@tarojs/components';
import type { TripForecastDay } from '@/types';
import styles from './index.module.scss';

const iconFor = (code: number) => code >= 80 ? '🌧️' : code >= 51 ? '🌦️' : code >= 1 ? '⛅' : '☀️';

const WeatherOverview: React.FC<{ days: TripForecastDay[] }> = ({ days }) => (
  <View className={styles.card}>
    <View className={styles.heading}>
      <Text className={styles.eyebrow}>WEATHER NOTES</Text>
      <Text className={styles.title}>旅途天气概览</Text>
    </View>
    <ScrollView scrollX className={styles.scroller} enhanced showScrollbar={false}>
      <View className={styles.days}>
        {days.map((day) => (
          <View className={styles.day} key={day.date}>
            <Text className={styles.date}>{day.date.slice(5).replace('-', '/')}</Text>
            <Text className={styles.icon}>{iconFor(day.weather_code)}</Text>
            <Text className={styles.weather}>{day.weather}</Text>
            <Text className={styles.temp}>{Math.round(day.temperature_min)}°–{Math.round(day.temperature_max)}°</Text>
            <Text className={styles.meta}>降水 {day.precipitation_probability}% · UV {day.uv_index}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  </View>
);

export default WeatherOverview;
