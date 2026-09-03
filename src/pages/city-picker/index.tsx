import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Button, Input, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import styles from './index.module.scss';
import NavBar from '@/components/NavBar';
import { DEFAULT_CITY } from '@/data/banners';
import { useAppStore } from '@/store/useAppStore';
import { locateCurrentCity } from '@/services/location';
import type { CityInfo } from '@/types';
import { buildPlanReturnUrl } from './citySelection';

// 省市区 mock 数据（简化版，用于演示美团式三级联动）
const PROVINCE_DATA: Array<{
  p: string;
  cities: Array<{ c: string; districts?: string[] }>;
}> = [
  {
    p: '吉林',
    cities: [
      { c: '延边朝鲜族自治州', districts: ['延吉市', '敦化市', '珲春市', '龙井市', '和龙市'] },
      { c: '长春市', districts: ['朝阳区', '南关区', '宽城区', '二道区', '绿园区'] },
      { c: '吉林市', districts: ['船营区', '昌邑区', '龙潭区', '丰满区'] }
    ]
  },
  {
    p: '北京',
    cities: [
      { c: '北京市', districts: ['东城区', '西城区', '朝阳区', '海淀区', '丰台区', '石景山区'] }
    ]
  },
  {
    p: '上海',
    cities: [
      { c: '上海市', districts: ['黄浦区', '徐汇区', '长宁区', '静安区', '浦东新区', '闵行区'] }
    ]
  },
  {
    p: '浙江',
    cities: [
      { c: '杭州市', districts: ['西湖区', '上城区', '拱墅区', '滨江区', '余杭区'] },
      { c: '宁波市', districts: ['海曙区', '江北区', '北仑区', '鄞州区'] },
      { c: '温州市', districts: ['鹿城区', '龙湾区', '瓯海区'] }
    ]
  },
  {
    p: '四川',
    cities: [
      { c: '成都市', districts: ['锦江区', '青羊区', '金牛区', '武侯区', '成华区', '高新区'] },
      { c: '乐山市', districts: ['市中区', '沙湾区', '峨眉山市'] }
    ]
  },
  {
    p: '云南',
    cities: [
      { c: '昆明市', districts: ['五华区', '盘龙区', '官渡区', '西山区'] },
      { c: '大理白族自治州', districts: ['大理市', '剑川县', '洱源县'] },
      { c: '丽江市', districts: ['古城区', '玉龙纳西族自治县'] }
    ]
  },
  {
    p: '国外',
    cities: [
      { c: '日本 东京都', districts: ['东京市', '新宿区', '涩谷区'] },
      { c: '日本 京都府', districts: ['京都市', '左京区', '东山区'] },
      { c: '韩国 首尔特别市', districts: ['首尔', '江南区', '明洞'] },
      { c: '法国 巴黎', districts: ['Paris'] },
      { c: '意大利 罗马', districts: ['Roma'] }
    ]
  }
];

const HOT_CITIES: CityInfo[] = [
  { province: '吉林', city: '延边朝鲜族自治州', district: '延吉市', fullName: '吉林 延边朝鲜族自治州 延吉市' },
  { province: '北京', city: '北京市', district: '朝阳区', fullName: '北京 北京市 朝阳区' },
  { province: '上海', city: '上海市', district: '浦东新区', fullName: '上海 上海市 浦东新区' },
  { province: '浙江', city: '杭州市', district: '西湖区', fullName: '浙江 杭州市 西湖区' },
  { province: '四川', city: '成都市', district: '锦江区', fullName: '四川 成都市 锦江区' },
  { province: '云南', city: '大理白族自治州', district: '大理市', fullName: '云南 大理白族自治州 大理市' },
  { province: '国外', city: '日本 京都府', district: '京都市', fullName: '日本 京都府 京都市' },
  { province: '国外', city: '韩国 首尔特别市', district: '首尔', fullName: '韩国 首尔特别市 首尔' },
  { province: '国外', city: '法国 巴黎', district: 'Paris', fullName: '法国 巴黎 Paris' }
];

function formatHistory() {
  try {
    const s = Taro.getStorageSync('city_history');
    if (Array.isArray(s)) return s.slice(0, 6);
  } catch {
    // ignore
  }
  return [DEFAULT_CITY];
}

function saveHistory(c: CityInfo) {
  try {
    const list = formatHistory().filter((x) => x.fullName !== c.fullName);
    list.unshift(c);
    Taro.setStorageSync('city_history', list.slice(0, 8));
  } catch {
    // ignore
  }
}

const CityPickerPage: React.FC = () => {
  const router = useRouter();
  const { draftDestination, setDraftDestination } = useAppStore();
  const [keyword, setKeyword] = useState('');
  const [history, setHistory] = useState<CityInfo[]>(formatHistory());
  const [provIdx, setProvIdx] = useState(0);
  const [cityIdx, setCityIdx] = useState(0);
  const [districtIdx, setDistrictIdx] = useState(0);

  useEffect(() => {
    if (draftDestination) {
      const p = PROVINCE_DATA.findIndex((x) => x.p === draftDestination.province);
      if (p >= 0) {
        setProvIdx(p);
        const cIdx = PROVINCE_DATA[p].cities.findIndex((x) => x.c === draftDestination.city);
        if (cIdx >= 0) {
          setCityIdx(cIdx);
          const dIdx = (PROVINCE_DATA[p].cities[cIdx].districts || []).findIndex(
            (d) => d === draftDestination.district
          );
          if (dIdx >= 0) setDistrictIdx(dIdx);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fromPlan = router.params?.from === 'plan';

  const provList = PROVINCE_DATA;
  const cityList = provList[provIdx]?.cities || [];
  const districtList = cityList[cityIdx]?.districts || [];

  const handleAutoLocate = async () => {
    Taro.showLoading({ title: '定位中...', mask: true });
    try {
      const city = await locateCurrentCity();
      handleSelect(city, true);
    } catch (error) {
      Taro.showToast({
        title: error instanceof Error ? error.message : '定位失败，请手动选择城市',
        icon: 'none',
        duration: 2800,
      });
    } finally {
      Taro.hideLoading();
    }
  };

  const handleSelect = (c: CityInfo, showToast = false) => {
    setDraftDestination(c);
    saveHistory(c);
    setHistory(formatHistory());
    if (showToast) {
      Taro.showToast({ title: `已选择${c.city}`, icon: 'success' });
    }
    setTimeout(() => {
      if (fromPlan) {
        Taro.redirectTo({ url: buildPlanReturnUrl(c) }).catch(() => {
          Taro.navigateTo({ url: buildPlanReturnUrl(c) }).catch(() => undefined);
        });
      } else {
        Taro.switchTab({ url: '/pages/home/index' }).catch(() => {
          Taro.navigateBack().catch(() => undefined);
        });
      }
    }, 350);
  };

  const handleClearHistory = () => {
    Taro.showModal({
      title: '清空历史',
      content: '确定清空历史搜索记录?',
      success: (res) => {
        if (res.confirm) {
          try { Taro.removeStorageSync('city_history'); } catch {
            // ignore
          }
          setHistory([DEFAULT_CITY]);
          Taro.showToast({ title: '已清空', icon: 'success' });
        }
      }
    });
  };

  // 从三级联动直接点选
  const handleClickDistrict = (district: string) => {
    const p = provList[provIdx].p;
    const c = cityList[cityIdx].c;
    const info: CityInfo = {
      province: p,
      city: c,
      district,
      fullName: `${p} ${c} ${district}`
    };
    handleSelect(info);
  };

  // 搜索过滤
  const filterHot = useMemo(() => {
    if (!keyword.trim()) return null;
    const kw = keyword.trim();
    const pool: CityInfo[] = [];
    PROVINCE_DATA.forEach((p) => {
      p.cities.forEach((c) => {
        (c.districts || []).forEach((d) => {
          pool.push({
            province: p.p,
            city: c.c,
            district: d,
            fullName: `${p.p} ${c.c} ${d}`
          });
        });
      });
    });
    return pool
      .filter((i) => i.fullName.includes(kw))
      .slice(0, 12);
  }, [keyword]);

  return (
    <View className={styles.pageWrap}>
      <NavBar
        title="选择目的地"
        showBack
        onBack={() => Taro.navigateBack().catch(() => undefined)}
      />

      <View className={styles.searchBar}>
        <View className={styles.searchRow}>
          <View className={styles.searchBox}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
              <path d="M21 21L16.65 16.65" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="11" cy="11" r="7" stroke="#9CA3AF" strokeWidth="2"/>
            </svg>
            <Input
              className={styles.searchInput}
              placeholder="搜索国内外城市 / 景点 / 地区"
              placeholderClass={styles.searchPlace}
              value={keyword}
              onInput={(e) => setKeyword(e.detail.value)}
              confirmType="search"
            />
          </View>
        </View>
      </View>

      <ScrollView scrollY style={{ height: 'calc(100vh - 120rpx)' }}>
        {keyword.trim() ? (
          <View className={styles.section}>
            <View className={styles.sectionTitleRow}>
              <Text className={styles.sectionTitle}>
                搜索结果 {filterHot && filterHot.length > 0 ? `（${filterHot.length}个）` : ''}
              </Text>
            </View>
            {filterHot && filterHot.length > 0 ? (
              <View className={styles.cityList}>
                {filterHot.map((c) => {
                  const active = c.fullName === draftDestination?.fullName;
                  return (
                    <View
                      key={c.fullName}
                      className={`${styles.cityItem} ${active ? styles.cityActive : ''}`}
                      onClick={() => handleSelect(c, true)}
                    >
                      <View className={styles.cityItemLeft}>
                        <Text className={styles.cityItemName}>{c.fullName}</Text>
                        <Text className={styles.cityItemSub}>
                          {c.province} · {c.city}
                        </Text>
                      </View>
                      <svg className={styles.cityItemArrow} viewBox="0 0 24 24" width="16" height="16" fill="none">
                        <path d="M9 6L15 12L9 18" stroke={active ? '#2BA471' : '#C9CDD4'} strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View className={styles.emptyTip}>
                <Text className={styles.emptyTitle}>没有找到匹配的城市</Text>
                <Text className={styles.emptyDesc}>试试更换关键词，或直接从下方省市区中选择</Text>
              </View>
            )}
          </View>
        ) : (
          <>
            {/* 当前定位 */}
            <View className={styles.section}>
              <View className={styles.sectionTitleRow}>
                <Text className={styles.sectionTitle}>当前定位</Text>
                <Button className={styles.locateBtn} onClick={handleAutoLocate}>
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="none">
                    <circle cx="12" cy="12" r="3" stroke="#2BA471" strokeWidth="1.8"/>
                    <path d="M12 2V5M12 19V22M2 12H5M19 12H22" stroke="#2BA471" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                  重新定位
                </Button>
              </View>
              <View className={styles.locateRow} onClick={() => handleSelect(DEFAULT_CITY, true)}>
                <View className={styles.locateIconBox}>
                  <svg viewBox="0 0 24 24" width="28" height="28" fill="none">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="#2BA471" strokeWidth="1.8"/>
                    <circle cx="12" cy="10" r="3" stroke="#2BA471" strokeWidth="1.8" fill="#F0FBF6"/>
                  </svg>
                </View>
                <View className={styles.locateContent}>
                  <Text className={styles.locateLabel}>已为你定位</Text>
                  <Text className={styles.locateName}>
                    {draftDestination?.fullName || DEFAULT_CITY.fullName}
                  </Text>
                </View>
              </View>
            </View>

            {/* 历史 */}
            <View className={styles.section}>
              <View className={styles.sectionTitleRow}>
                <Text className={styles.sectionTitle}>最近访问</Text>
                <Button className={styles.clearBtn} onClick={handleClearHistory}>
                  清空
                </Button>
              </View>
              <View className={styles.historyRow}>
                {history.map((c) => (
                  <Button
                    key={c.fullName}
                    className={styles.historyTag}
                    onClick={() => handleSelect(c, true)}
                  >
                    {c.city}
                  </Button>
                ))}
              </View>
            </View>

            {/* 热门城市 */}
            <View className={styles.section}>
              <View className={styles.sectionTitleRow}>
                <Text className={styles.sectionTitle}>热门目的地</Text>
              </View>
              <View className={styles.hotGrid}>
                {HOT_CITIES.map((c) => (
                  <Button
                    key={c.fullName}
                    className={styles.hotItem}
                    onClick={() => handleSelect(c, true)}
                  >
                    {c.city.slice(0, 12)}
                  </Button>
                ))}
              </View>
            </View>

            {/* 省市区三级联动 */}
            <View className={styles.section}>
              <View className={styles.sectionTitleRow}>
                <Text className={styles.sectionTitle}>全部省市区</Text>
              </View>

              <ScrollView scrollX className={styles.provinceTab}>
                {provList.map((p, idx) => (
                  <Button
                    key={p.p}
                    className={`${styles.provItem} ${idx === provIdx ? styles.provItemActive : ''}`}
                    onClick={() => {
                      setProvIdx(idx);
                      setCityIdx(0);
                      setDistrictIdx(0);
                    }}
                  >
                    {p.p}
                  </Button>
                ))}
              </ScrollView>

              <ScrollView scrollX style={{ marginBottom: 12, whiteSpace: 'nowrap' }}>
                {cityList.map((c, idx) => (
                  <Button
                    key={c.c}
                    className={`${styles.historyTag}`}
                    style={
                      idx === cityIdx
                        ? { background: '#F0FBF6', color: '#2BA471', borderColor: '#2BA471' } as any
                        : {}
                    }
                    onClick={() => {
                      setCityIdx(idx);
                      setDistrictIdx(0);
                    }}
                  >
                    {c.c}
                  </Button>
                ))}
              </ScrollView>

              <View className={styles.cityList}>
                {districtList.length > 0 ? (
                  districtList.map((d, idx) => {
                    const active = idx === districtIdx && draftDestination?.province === provList[provIdx].p && draftDestination?.city === cityList[cityIdx].c && draftDestination?.district === d;
                    return (
                      <View
                        key={d}
                        className={`${styles.cityItem} ${active ? styles.cityActive : ''}`}
                        onClick={() => handleClickDistrict(d)}
                      >
                        <View className={styles.cityItemLeft}>
                          <Text className={styles.cityItemName}>
                            {provList[provIdx].p} - {cityList[cityIdx].c} - {d}
                          </Text>
                          <Text className={styles.cityItemSub}>
                            点击选择此区县作为目的地
                          </Text>
                        </View>
                        <svg className={styles.cityItemArrow} viewBox="0 0 24 24" width="16" height="16" fill="none">
                          <path d="M9 6L15 12L9 18" stroke={active ? '#2BA471' : '#C9CDD4'} strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      </View>
                    );
                  })
                ) : (
                  cityList.map((c, idx) => (
                    <View
                      key={c.c}
                      className={`${styles.cityItem} ${idx === cityIdx ? styles.cityActive : ''}`}
                      onClick={() => {
                        const info: CityInfo = {
                          province: provList[provIdx].p,
                          city: c.c,
                          district: c.c,
                          fullName: `${provList[provIdx].p} ${c.c}`
                        };
                        handleSelect(info);
                      }}
                    >
                      <View className={styles.cityItemLeft}>
                        <Text className={styles.cityItemName}>{c.c}</Text>
                        <Text className={styles.cityItemSub}>{provList[provIdx].p}</Text>
                      </View>
                      <svg className={styles.cityItemArrow} viewBox="0 0 24 24" width="16" height="16" fill="none">
                        <path d="M9 6L15 12L9 18" stroke="#C9CDD4" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </View>
                  ))
                )}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

export default CityPickerPage;
