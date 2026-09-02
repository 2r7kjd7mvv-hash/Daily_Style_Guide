import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Button, Input } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import styles from './index.module.scss';
import NavBar from '@/components/NavBar';
import DateRangePicker from '@/components/DateRangePicker';
import StylePicker from '@/components/StylePicker';
import OutfitCard from '@/components/OutfitCard';
import { DEFAULT_CITY } from '@/data/banners';
import { saveOutfitPlan, login } from '@/services/outfit';
import { useAppStore } from '@/store/useAppStore';
import { STYLE_OPTIONS } from '@/types';
import type { OutfitPlan, CityInfo } from '@/types';
import { buildWorkflowRequest, generateOutfitPlan } from '@/services/coze';
import EmptyState from '@/components/EmptyState';

type Step = 1 | 2 | 3;

const PlanPage: React.FC = () => {
  const router = useRouter();
  const {
    user,
    setUser,
    draftDestination,
    draftStartDate,
    draftEndDate,
    draftStyle,
    draftColor,
    draftOccasion,
    draftAvoid,
    setDraftDestination,
    setDraftDate,
    setDraftStyle,
    setDraftColor,
    setDraftOccasion,
    setDraftAvoid,
    draftDailyList,
    setDraftDailyList
  } = useAppStore();

  const [step, setStep] = useState<Step>(1);
  const [loadingIdx, setLoadingIdx] = useState(0);
  const [saving, setSaving] = useState(false);
  const [generationError, setGenerationError] = useState('');
  const [isDemo, setIsDemo] = useState(false);

  const destination: CityInfo = draftDestination || DEFAULT_CITY;
  const styleLabel = useMemo(
    () => STYLE_OPTIONS.find((s) => s.key === draftStyle)?.label || '简约大气',
    [draftStyle]
  );

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

  useEffect(() => {
    if (!user) {
      login()
        .then((u) => setUser(u))
        .catch(() => undefined);
    }
  }, [user, setUser]);

  const goCityPicker = () => {
    Taro.navigateTo({ url: '/pages/city-picker/index?from=plan' }).catch(console.error);
  };

  const handleAutoLocate = () => goCityPicker();

  const canGoStep2 = useMemo(() => {
    return destination && draftStartDate && draftEndDate && draftStyle;
  }, [destination, draftStartDate, draftEndDate, draftStyle]);

  const handleGoStep2 = async () => {
    if (!canGoStep2) {
      const tips = !destination
        ? '请先选择目的地'
        : !draftStyle
          ? '请选择风格'
          : '请完善日期';
      Taro.showToast({ title: tips, icon: 'none' });
      return;
    }
    const duration = Math.round(
      (new Date(draftEndDate).getTime() - new Date(draftStartDate).getTime()) / 86400000,
    ) + 1;
    if (duration < 1 || duration > 14) {
      Taro.showToast({ title: '旅行周期请选择 1–14 天', icon: 'none' });
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
        stylePreference: styleLabel,
        colorPreference: draftColor,
        avoidItems: draftAvoid,
        occasion: draftOccasion,
      });
      const result = await generateOutfitPlan(request, {
        onEvent: (event) => {
          if (event.event === 'Message') setLoadingIdx((current) => Math.min(current + 1, 4));
        },
      });
      setDraftDailyList(result.dailyList);
      setIsDemo(result.source === 'demo');
      setStep(3);
    } catch (error) {
      setGenerationError(error instanceof Error ? error.message : '生成失败，请重试');
    }
  };

  const loadingSteps = useMemo(
    () => [
      { key: 'weather', text: '正在获取目的地实时天气...' },
      { key: 'style', text: `匹配${styleLabel}风格穿搭库...` },
      { key: 'city', text: `解析${destination.city}地域特色...` },
      { key: 'ai', text: 'AI 正在为你设计每日穿搭...' },
      { key: 'img', text: '正在生成穿搭图片，优化方案细节...' }
    ],
    [styleLabel, destination]
  );

  const handleReset = () => {
    setStep(1);
    setDraftDailyList([]);
  };

  const handleSave = async () => {
    if (!draftDailyList.length) {
      Taro.showToast({ title: '还没有穿搭内容', icon: 'none' });
      return;
    }
    setSaving(true);
    try {
      const plan: OutfitPlan = {
        destination,
        start_date: draftStartDate,
        end_date: draftEndDate,
        style_preference: draftStyle,
        color_preference: draftColor,
        occasion: draftOccasion,
        avoid_items: draftAvoid,
        daily_list: draftDailyList,
        created_at: Date.now(),
        updated_at: Date.now()
      };
      await saveOutfitPlan(plan);
      Taro.showToast({ title: '已保存到「我的穿搭」', icon: 'success' });
      setTimeout(() => {
        Taro.switchTab({ url: '/pages/outfits/index' }).catch(() => {
          Taro.navigateBack().catch(() => undefined);
        });
      }, 800);
    } catch (e) {
      console.error(e);
      Taro.showToast({ title: '保存失败，请重试', icon: 'none' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className={styles.pageWrap}>
      <NavBar
        title={step === 1 ? '选择行程信息' : step === 2 ? 'AI 正在设计穿搭' : '穿搭方案已生成'}
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
          {/* 目的地 */}
          <View className={styles.card}>
            <View className={styles.formTitle}>
              <View className={styles.formTitleIcon}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="10" r="3" stroke="white" strokeWidth="1.8"/>
                </svg>
              </View>
              <Text className={styles.formTitleText}>选择目的地</Text>
            </View>
            <Text className={styles.formDesc}>支持国内外城市，点击右上角切换</Text>

            <View className={styles.cityPickerRow} onClick={goCityPicker}>
              <View className={styles.cityIconBox}>
                <svg viewBox="0 0 24 24" width="32" height="32" fill="none">
                  <path d="M12 22C12 22 20 16 20 10C20 6.686 17.314 4 14 4C12.87 4 11.85 4.309 11.06 4.845C10.26 5.381 9.74 6.12 9.5 7L10 9H8L8.5 7" stroke="#2BA471" strokeWidth="1.8" strokeLinecap="round"/>
                  <circle cx="12" cy="12" r="3" stroke="#2BA471" strokeWidth="1.8"/>
                </svg>
              </View>
              <View className={styles.cityContent}>
                <Text className={styles.cityTitle}>{destination.fullName}</Text>
                <Text className={styles.citySub}>点击选择其他城市 / 定位当前位置</Text>
              </View>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
                <path d="M9 6L15 12L9 18" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </View>

            <View style={{ marginTop: 16 }}>
              <Button className={styles.autoLocateBtn} onClick={handleAutoLocate}>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none">
                  <circle cx="12" cy="12" r="3" stroke="#2BA471" strokeWidth="1.8"/>
                  <path d="M12 2V5M12 19V22M2 12H5M19 12H22" stroke="#2BA471" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
                自动定位
              </Button>
            </View>
          </View>

          {/* 日期 */}
          <View className={styles.card}>
            <DateRangePicker
              startDate={draftStartDate}
              endDate={draftEndDate}
              onChange={setDraftDate}
              minDate={new Date().toISOString().slice(0, 10)}
            />
          </View>

          {/* 风格 */}
          <View className={styles.card}>
            <StylePicker value={draftStyle} onChange={setDraftStyle} />
            <View className={styles.preferenceFields}>
              <Input className={styles.preferenceInput} value={draftColor} placeholder="偏好色系（选填）" onInput={(e) => setDraftColor(e.detail.value)} />
              <Input className={styles.preferenceInput} value={draftOccasion} placeholder="旅行场景，如城市漫步（选填）" onInput={(e) => setDraftOccasion(e.detail.value)} />
              <Input className={styles.preferenceInput} value={draftAvoid} placeholder="不想穿的单品（选填）" onInput={(e) => setDraftAvoid(e.detail.value)} />
            </View>
          </View>
        </View>
      )}

      {step === 2 && (
        <View className={styles.loadingWrap}>
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
            结合 {destination.city} 实时天气、{styleLabel} 风格偏好，
            {'\n'}AI 正在设计每天的最佳穿衣组合
          </Text>
          <View className={styles.loadingSteps}>
            {loadingSteps.map((s, i) => {
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

          <View className={styles.dailyTitleRow}>
            <Text className={styles.dailyTitle}>每日穿搭</Text>
            <Text className={styles.dailyCount}>共 {draftDailyList.length} 套方案</Text>
          </View>

          {draftDailyList.length === 0 ? (
            <EmptyState
              title="暂无数据"
              desc="这次没有生成有效方案"
              actionText="重新生成"
              onAction={handleGoStep2}
              secondaryActionText="返回修改条件"
              onSecondaryAction={() => setStep(1)}
            />
          ) : (
            draftDailyList.map((d, idx) => (
              <OutfitCard
                key={d.date + idx}
                date={d.date}
                destination={destination.fullName}
                weather={d.weather}
                temperature={d.temperature}
                feeling={d.feeling}
                daily={d}
                showDateTag
                isActiveDay={idx === 0}
              />
            ))
          )}
        </View>
      )}

      {/* 底部按钮 */}
      {step === 1 && (
        <View className={styles.bottomBar}>
          <Button className={styles.ghostBtn} onClick={handleReset}>
            清空重选
          </Button>
          <Button
            className={styles.primaryBtn}
            disabled={!canGoStep2}
            onClick={handleGoStep2}
          >
            开始设计穿搭
          </Button>
        </View>
      )}

      {step === 3 && (
        <View className={styles.bottomBar}>
          <Button className={styles.ghostBtn} onClick={handleReset}>
            重新设计
          </Button>
          <Button
            className={styles.primaryBtn}
            loading={saving}
            disabled={saving || !draftDailyList.length}
            onClick={handleSave}
          >
            保存我的穿搭
          </Button>
        </View>
      )}
    </View>
  );
};

export default PlanPage;
