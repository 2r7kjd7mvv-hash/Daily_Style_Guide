import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Button, Image } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import styles from './index.module.scss';
import NavBar from '@/components/NavBar';
import DateRangePicker from '@/components/DateRangePicker';
import PreferencePicker from '@/components/PreferencePicker';
import WeatherOverview from '@/components/WeatherOverview';
import OutfitChecklist from '@/components/OutfitChecklist';
import { DEFAULT_CITY } from '@/data/banners';
import { useAppStore } from '@/store/useAppStore';
import { TRIP_COLOR_OPTIONS, TRIP_STYLE_OPTIONS } from '@/features/trip/preferences';
import type { CityInfo, TripForecastDay } from '@/types';
import { buildWorkflowRequest, generateOutfitPlan } from '@/services/coze';
import { getTripForecast } from '@/services/weather';
import { downloadOutfitImages } from '@/services/download';
import EmptyState from '@/components/EmptyState';
import { getPlanningMaxDate, getTripStepAction, validateTravelDates } from './planFlow';
import { getLoadingStepIndex } from './loadingState';

type Step = 1 | 2 | 3;

const PlanPage: React.FC = () => {
  const router = useRouter();
  const {
    draftDestination,
    draftStartDate,
    draftEndDate,
    draftStyle,
    draftStyles,
    draftColors,
    draftOccasion,
    draftAvoid,
    setDraftDestination,
    setDraftDate,
    setDraftStyles,
    setDraftColors,
    draftDailyList,
    setDraftDailyList,
    draftForecast,
    setDraftForecast,
  } = useAppStore();

  const [step, setStep] = useState<Step>(1);
  const [loadingIdx, setLoadingIdx] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [generationError, setGenerationError] = useState('');
  const [isDemo, setIsDemo] = useState(false);

  const destination: CityInfo = draftDestination || DEFAULT_CITY;
  const destSelected = Boolean(draftDestination);
  const dateSelected = Boolean(draftStartDate && draftEndDate);
  const styleLabels = useMemo(() => TRIP_STYLE_OPTIONS.filter((item) => draftStyles.includes(item.key)).map((item) => item.label), [draftStyles]);
  const colorLabels = useMemo(() => TRIP_COLOR_OPTIONS.filter((item) => draftColors.includes(item.key)).map((item) => item.label), [draftColors]);
  const styleLabel = styleLabels.join('、');
  const totalDays = dateSelected
    ? Math.round(
        (new Date(draftEndDate).getTime() - new Date(draftStartDate).getTime()) / 86400000,
      ) + 1
    : 0;
  const hasMultipleDays = totalDays > 1;

  const dateSummary = useMemo(() => {
    if (!dateSelected) return '';
    return `${draftStartDate.slice(5).replace('-', '/')}–${draftEndDate.slice(5)}`;
  }, [dateSelected, draftStartDate, draftEndDate]);

  const missingRequired = useMemo(() => {
    if (!destSelected) return '目的地';
    if (!draftStyles.length) return '穿搭风格';
    if (!dateSelected) return '出行时间';
    return null;
  }, [destSelected, draftStyles, dateSelected]);

  useEffect(() => {
    const dest = router.params?.destination;
    if (dest) {
      try {
        const d = JSON.parse(decodeURIComponent(dest));
        setDraftDestination(d);
      } catch {
        // ignore
      }
    }
  }, [router.params, setDraftDestination]);

  const goCityPicker = () => {
    Taro.navigateTo({ url: '/pages/city-picker/index?from=plan' }).catch(console.error);
  };

  const tripStepAction = useMemo(() => {
    return getTripStepAction({
      hasDestination: destSelected,
      startDate: draftStartDate,
      endDate: draftEndDate,
      style: draftStyle,
      styles: draftStyles,
    });
  }, [destSelected, draftStartDate, draftEndDate, draftStyle, draftStyles]);

  const canGoStep2 = !tripStepAction.disabled;

  const handleGoStep2 = async () => {
    if (!canGoStep2) {
      const tips = !destSelected
        ? '请先选择目的地'
        : !draftStyles.length
          ? '请选择风格'
          : '请完善日期';
      Taro.showToast({ title: tips, icon: 'none' });
      return;
    }
    const dateError = validateTravelDates(draftStartDate, draftEndDate);
    if (dateError) {
      Taro.showToast({ title: dateError, icon: 'none' });
      return;
    }
    setStep(2);
    setLoadingIdx(0);
    setGenerationError('');
    try {
      const request = buildWorkflowRequest({
        destination,
        startDate: draftStartDate,
        endDate: draftEndDate,
        stylePreferences: styleLabels,
        colorPreferences: colorLabels,
        avoidItems: draftAvoid,
        occasion: draftOccasion,
      });
      const forecastPromise = getTripForecast(request).catch(() => []);
      const result = await generateOutfitPlan(request, {
        onEvent: (event) => {
          setLoadingIdx((current) => getLoadingStepIndex(event, current));
        },
      });
      setDraftDailyList(result.dailyList);
      setDraftForecast(await forecastPromise);
      setIsDemo(result.source === 'demo');
      setStep(3);
    } catch (error) {
      console.error('[plan] 生成失败', error);
      setGenerationError(error instanceof Error ? error.message : '生成失败，请重试');
    }
  };

  const loadingSteps = useMemo(
    () => [
      { key: 'weather', text: '正在获取目的地实时天气...' },
      { key: 'style', text: styleLabel ? `匹配${styleLabel}风格穿搭库...` : '匹配你的风格穿搭库...' },
      { key: 'city', text: `解析${destination.city}地域特色...` },
      { key: 'ai', text: 'AI 正在为你设计每日穿搭...' },
      { key: 'img', text: '正在生成穿搭参考图...' }
    ],
    [styleLabel, destination]
  );

  const handleReset = () => {
    setStep(1);
    setGenerationError('');
    setDraftDailyList([]);
    setDraftForecast([]);
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const count = await downloadOutfitImages(draftDailyList.map((item) => ({
        url: item.image_url,
        date: item.date,
      })));
      Taro.showToast({ title: count > 1 ? `已下载 ${count} 张图片` : '图片已下载', icon: 'success' });
    } catch (error) {
      Taro.showToast({ title: error instanceof Error ? error.message : '下载失败', icon: 'none' });
    } finally {
      setDownloading(false);
    }
  };

  const forecastDays = useMemo<TripForecastDay[]>(() => {
    if (draftForecast.length) return draftForecast;
    return draftDailyList.map((day) => {
      const numbers = day.temperature.match(/-?\d+(?:\.\d+)?/g)?.map(Number) || [];
      return {
        date: day.date,
        weather: day.weather,
        weather_code: day.weather.includes('雨') ? 61 : day.weather.includes('云') ? 2 : 0,
        temperature_min: numbers[0] || 0,
        temperature_max: numbers[1] ?? numbers[0] ?? 0,
        precipitation_probability: 0,
        uv_index: 0,
        timezone: '',
      };
    });
  }, [draftForecast, draftDailyList]);

  const renderGroupHeader = (badge: string, title: string, chip: string, filled: boolean) => (
    <View className={styles.groupHeader}>
      <View className={styles.groupHeadLeft}>
        <View className={styles.groupBadge}>{badge}</View>
        <Text className={styles.groupTitle}>{title}</Text>
      </View>
      <View className={`${styles.groupChip} ${filled ? styles.groupChipOn : ''}`}>
        {chip || '未选择'}
      </View>
    </View>
  );

  return (
    <View className={styles.pageWrap}>
      <NavBar
        title={step === 1 ? '设计穿搭' : step === 2 ? 'AI 正在设计穿搭' : '穿搭方案已生成'}
        showBack
        onBack={() => {
          if (step === 1) Taro.navigateBack().catch(() => undefined);
          else setStep((s) => (Math.max(1, s - 1) as Step));
        }}
      />

      {/* 进度条 */}
      <View className={styles.stepBar}>
        {[1, 2, 3].map((s, i, arr) => {
          const cls = step === s ? styles.stepActive : step > s ? styles.stepDone : '';
          return (
            <React.Fragment key={s}>
              <View className={`${styles.stepItem} ${cls}`}>
                <View className={styles.stepDot}>
                  {step > s ? (
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
                      <path d="M5 12L10 17L19 8" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    s
                  )}
                </View>
                <Text className={styles.stepLabel}>
                  {s === 1 ? '行程信息' : s === 2 ? 'AI 生成' : '方案结果'}
                </Text>
              </View>
              {i < arr.length - 1 && (
                <View className={`${styles.stepLine} ${step > s ? styles.stepDone : step === s ? styles.stepActive : ''}`} />
              )}
            </React.Fragment>
          );
        })}
      </View>

      {step === 1 && (
        <View className={styles.formSection}>
          {/* 1 目的地 */}
          <View className={styles.card}>
            {renderGroupHeader('1', '选择目的地', destSelected ? destination.city : '', destSelected)}
            <View className={styles.cityPickerRow} onClick={goCityPicker}>
              <View className={styles.cityIconBox}>
                <svg viewBox="0 0 24 24" width="32" height="32" fill="none">
                  <path d="M12 22C12 22 20 16 20 10C20 6.686 17.314 4 14 4C12.87 4 11.85 4.309 11.06 4.845C10.26 5.381 9.74 6.12 9.5 7L10 9H8L8.5 7" stroke="#2BA471" strokeWidth="1.8" strokeLinecap="round"/>
                  <circle cx="12" cy="12" r="3" stroke="#2BA471" strokeWidth="1.8"/>
                </svg>
              </View>
              <View className={styles.cityContent}>
                <Text className={styles.cityTitle}>
                  {destSelected ? destination.fullName : '选择目的地'}
                </Text>
                <Text className={styles.citySub}>
                  {destSelected ? '点击更换 · 支持自动定位' : '支持国内外城市 · 点击选择'}
                </Text>
              </View>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
                <path d="M9 6L15 12L9 18" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </View>
          </View>

          {/* 2 出行时间 */}
          <View className={styles.card}>
            {renderGroupHeader('2', '选择出行时间', dateSummary, dateSelected)}
            <DateRangePicker
              startDate={draftStartDate}
              endDate={draftEndDate}
              onChange={setDraftDate}
              minDate={new Date().toISOString().slice(0, 10)}
              maxDate={getPlanningMaxDate()}
              maxRangeDays={6}
              hideTitle
            />
          </View>

          {/* 3 穿搭风格 */}
          <View className={styles.card}>
            {renderGroupHeader('3', '选择穿搭风格', styleLabel, Boolean(styleLabel))}
            <PreferencePicker options={TRIP_STYLE_OPTIONS} values={draftStyles} onChange={setDraftStyles} />
          </View>

          <View className={styles.card}>
            {renderGroupHeader('4', '选择喜好颜色', colorLabels.join('、'), Boolean(colorLabels.length))}
            <PreferencePicker options={TRIP_COLOR_OPTIONS} values={draftColors} onChange={setDraftColors} />
          </View>

          <View className={styles.formActions}>
            <Button
              className={`${styles.nextBtn} ${canGoStep2 ? '' : styles.nextBtnDisabled}`}
              disabled={!canGoStep2}
              onClick={handleGoStep2}
            >
              下一步：AI 生成
            </Button>
            <Text className={`${styles.nextHint} ${canGoStep2 ? '' : styles.nextHintWarn}`}>
              {missingRequired
                ? `请先选择${missingRequired}即可开始生成`
                : hasMultipleDays
                  ? `共 ${totalDays} 天 · 将按天生成穿搭参考图，请耐心等待`
                  : '16 天内任选 1/3/7 天 · 将结合天气生成穿搭参考图'}
            </Text>
          </View>
        </View>
      )}

      {step === 2 && (
        <View className={styles.loadingWrap}>
          <View className={`${styles.loadingFabric} ${styles.loadingFabricOne}`} />
          <View className={`${styles.loadingFabric} ${styles.loadingFabricTwo}`} />
          {generationError ? (
            <EmptyState
              title="生成暂时中断"
              desc={generationError}
              actionText="重新生成"
              onAction={handleGoStep2}
              secondaryActionText="返回修改条件"
              onSecondaryAction={() => setStep(1)}
            />
          ) : (
          <>
          <View className={styles.ringLoader}>
            <View className={styles.loadingIcon}>
              <svg viewBox="0 0 48 48" width="56" height="56" fill="none">
                <path d="M24 4V10M24 38V44M4 24H10M38 24H44M10.5 10.5L14.5 14.5M33.5 33.5L37.5 37.5M10.5 37.5L14.5 33.5M33.5 14.5L37.5 10.5" stroke="#2BA471" strokeWidth="3" strokeLinecap="round"/>
                <circle cx="24" cy="24" r="4" fill="#2BA471"/>
              </svg>
            </View>
          </View>
          <Text className={styles.loadingTitle}>正在为你定制穿搭方案 ✨</Text>
          <Text className={styles.loadingDesc}>
            结合 {destination.city} 实时天气、{styleLabel || '所选风格'} 风格偏好，
            {'\n'}AI 正在设计每天的最佳穿衣组合
          </Text>
          <View className={styles.loadingSteps}>
            {loadingSteps.map((s, i) => {
              if (i > loadingIdx) return null; // 后续步骤未到时再出现，跟随真实进度
              const isDone = loadingIdx > i;
              const isActive = loadingIdx === i;
              return (
                <View
                  key={s.key}
                  className={`${styles.loadingStep} ${isDone ? styles.stepDoneBg : ''}`}
                >
                  <View
                    className={`${styles.loadingDot} ${
                      isDone ? styles.dotDone : isActive ? styles.dotActive : styles.dotPending
                    }`}
                  >
                    {isDone && (
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none">
                        <path d="M5 12L10 17L19 8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </View>
                  <Text
                    className={`${styles.loadingStepText} ${
                      isDone ? styles.doneStepText : isActive ? styles.activeStepText : ''
                    }`}
                  >
                    {s.text}
                  </Text>
                </View>
              );
            })}
          </View>
          </>
          )}
        </View>
      )}

      {step === 3 && (
        <View className={styles.resultWrap}>
          <View className={styles.resultHead}>
            <View className={styles.successBadge}>
              <svg viewBox="0 0 24 24" width="60" height="60" fill="none">
                <path d="M5 12L10 17L19 8" stroke="white" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </View>
            <Text className={styles.resultTitle}>穿搭方案生成成功 🎉</Text>
            {isDemo && <Text className={styles.demoBadge}>演示数据 · 配置 Worker 后启用真实生成</Text>}
            <Text className={styles.resultDesc}>
              根据 {destination.fullName}{'\n'}
              {draftStartDate.slice(5)} ~ {draftEndDate.slice(5)} 天气和 {styleLabel} 风格定制
            </Text>
            <View className={styles.summaryTagRow}>
              <Text className={styles.summaryTag}>{destination.city}</Text>
              <Text className={styles.summaryTag}>{styleLabel}</Text>
              <Text className={styles.summaryTag}>{draftDailyList.length}天穿搭</Text>
            </View>
          </View>

          <>
            {forecastDays.length > 0 && <WeatherOverview days={forecastDays} />}
            {draftDailyList.map((daily, index) => (
              <View className={styles.strategySection} key={daily.date}>
                <View className={styles.strategyIntro}>
                  <Text className={styles.strategyDay}>DAY {String(index + 1).padStart(2, '0')} · {daily.date.slice(5)}</Text>
                  <Text className={styles.strategyTitle}>{daily.city || destination.city} 的今日穿搭</Text>
                  <Text className={styles.strategyCopy}>{daily.reasoning_content || `${daily.temperature}，${daily.feeling}。建议以舒适叠穿为主，方便随天气变化穿脱。`}</Text>
                </View>
                {daily.image_url && <View className={styles.heroImageWrap}><Image className={styles.heroImage} src={daily.image_url} mode="aspectFill" /></View>}
                <View className={styles.reminder}>{daily.reminder}</View>
                <OutfitChecklist daily={daily} />
              </View>
            ))}
          </>
        </View>
      )}

      {/* 下载只保存到用户设备，不写入系统历史记录 */}
      {step === 3 && (
        <View className={styles.bottomBar}>
          <View className={styles.secondaryBtn} onClick={handleReset}>
            重新设计
          </View>
          <View
            className={`${styles.primaryBtn} ${downloading || !draftDailyList.length ? styles.btnDisabled : ''}`}
            onClick={() => !downloading && draftDailyList.length > 0 && handleDownload()}
          >
            {downloading ? '下载中…' : '下载图片'}
          </View>
        </View>
      )}
    </View>
  );
};

export default PlanPage;
