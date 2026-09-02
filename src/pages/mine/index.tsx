import React, { useEffect, useState } from 'react';
import { View, Text, Button, Image, ScrollView } from '@tarojs/components';
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro';
import styles from './index.module.scss';
import EmptyState from '@/components/EmptyState';
import { login, getOutfitPlans } from '@/services/outfit';
import { useAppStore } from '@/store/useAppStore';
import type { UserInfo } from '@/types';

const AVATAR_DEFAULT =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><rect width='200' height='200' fill='%23F0FBF6'/><circle cx='100' cy='80' r='36' fill='%232BA471'/><path d='M30 200 Q30 140 100 140 Q170 140 170 200' fill='%234EC093'/></svg>`
  );

const MinePage: React.FC = () => {
  const { user, setUser } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [totalPlans, setTotalPlans] = useState(0);
  const [totalDays, setTotalDays] = useState(0);
  const [totalCities, setTotalCities] = useState(0);

  const loadStats = async () => {
    setLoading(true);
    try {
      if (!user) {
        const u = await login();
        setUser(u);
      }
      const res = await getOutfitPlans({ page: 1, pageSize: 100 });
      const list = res.list || [];
      setTotalPlans(list.length);
      setTotalDays(list.reduce((sum, p) => sum + (p.daily_list?.length || 0), 0));
      const cities = new Set(list.map((p) => p.destination?.fullName).filter(Boolean));
      setTotalCities(cities.size);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      Taro.stopPullDownRefresh();
    }
  };

  useDidShow(() => {
    loadStats();
  });

  useEffect(() => {
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  usePullDownRefresh(() => {
    loadStats();
  });

  const handleLogin = async () => {
    if (user) return;
    const u = await login();
    setUser(u);
  };

  const handleLogout = () => {
    Taro.showModal({
      title: '确定退出登录?',
      content: '退出后本地穿搭记录不会丢失',
      confirmColor: '#F53F3F',
      success: (res) => {
        if (res.confirm) {
          setUser(null);
          Taro.showToast({ title: '已退出登录', icon: 'success' });
        }
      }
    });
  };

  const goPage = (url: string, isTab = false) => {
    if (isTab) {
      Taro.switchTab({ url }).catch(console.error);
    } else {
      Taro.navigateTo({ url }).catch(console.error);
    }
  };

  const menuItems: Array<{
    id: string;
    title: string;
    desc?: string;
    badge?: string;
    icon: React.ReactNode;
    onClick: () => void;
  }> = [
    {
      id: 'outfits',
      title: '我的穿搭',
      desc: `${totalPlans} 套旅行穿搭策略`,
      icon: (
        <svg viewBox="0 0 24 24" width="26" height="26" fill="none">
          <rect x="3" y="4" width="18" height="16" rx="3" stroke="#2BA471" strokeWidth="1.8" />
          <path d="M3 10H21" stroke="#2BA471" strokeWidth="1.8" />
          <path d="M8 4V10" stroke="#2BA471" strokeWidth="1.8" />
        </svg>
      ),
      onClick: () => goPage('/pages/outfits/index', true)
    },
    {
      id: 'create',
      title: '设计新穿搭',
      desc: '结合目的地天气和风格定制',
      badge: '新',
      icon: (
        <svg viewBox="0 0 24 24" width="26" height="26" fill="none">
          <path
            d="M12 2V22M2 12H22"
            stroke="#FF8A3D"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      ),
      onClick: () => goPage('/pages/plan/index')
    },
    {
      id: 'fav',
      title: '我的收藏',
      desc: '暂未上线',
      icon: (
        <svg viewBox="0 0 24 24" width="26" height="26" fill="none">
          <path
            d="M12 21L10.2 19.4C5.4 15.06 2.4 12.36 2.4 9C2.4 6.22 4.6 4 7.4 4C8.92 4 10.4 4.72 11.3 5.9L12 6.8L12.7 5.9C13.6 4.72 15.08 4 16.6 4C19.4 4 21.6 6.22 21.6 9C21.6 12.36 18.6 15.06 13.8 19.4L12 21Z"
            stroke="#2BA471"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
      onClick: () => Taro.showToast({ title: '功能开发中', icon: 'none' })
    },
    {
      id: 'style',
      title: '风格偏好设置',
      desc: '默认风格 / 色系 / 雷区',
      icon: (
        <svg viewBox="0 0 24 24" width="26" height="26" fill="none">
          <path
            d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
            stroke="#2BA471"
            strokeWidth="1.8"
          />
          <circle cx="8" cy="10" r="1.8" fill="#FF8A3D" />
          <circle cx="13" cy="8" r="1.4" fill="#2BA471" />
          <circle cx="16" cy="13" r="1.6" fill="#FFD93D" />
          <circle cx="9" cy="15" r="1.4" fill="#4EC093" />
          <path d="M17 18C15.5 16 13.5 17 12 16C10.5 17 8.5 16 7 18" stroke="#2BA471" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      ),
      onClick: () => Taro.showToast({ title: '功能开发中', icon: 'none' })
    },
    {
      id: 'help',
      title: '使用帮助',
      desc: '常见问题 & 穿搭技巧',
      icon: (
        <svg viewBox="0 0 24 24" width="26" height="26" fill="none">
          <circle cx="12" cy="12" r="10" stroke="#2BA471" strokeWidth="1.8" />
          <path
            d="M9.5 9C9.5 7.61929 10.6193 6.5 12 6.5C13.3807 6.5 14.5 7.61929 14.5 9C14.5 9.78213 14.147 10.4718 13.591 10.9246C13.2252 11.23 13 11.6746 13 12.15V13"
            stroke="#2BA471"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <circle cx="12" cy="17" r="1" fill="#2BA471" />
        </svg>
      ),
      onClick: () => Taro.showToast({ title: '功能开发中', icon: 'none' })
    },
    {
      id: 'about',
      title: '关于我们',
      desc: '版本 v1.0.0',
      icon: (
        <svg viewBox="0 0 24 24" width="26" height="26" fill="none">
          <rect x="3" y="3" width="18" height="18" rx="4" stroke="#2BA471" strokeWidth="1.8" />
          <path d="M12 8V16" stroke="#2BA471" strokeWidth="2" strokeLinecap="round" />
          <circle cx="12" cy="6" r="1" fill="#2BA471" />
        </svg>
      ),
      onClick: () => Taro.showToast({ title: '每日穿搭 v1.0.0', icon: 'none' })
    }
  ];

  const u: UserInfo = user || {
    openid: '',
    nickName: '点击登录',
    avatarUrl: AVATAR_DEFAULT,
    created_at: Date.now()
  };

  return (
    <ScrollView scrollY className={styles.pageWrap}>
      {/* 头部渐变 */}
      <View className={styles.header}>
        <View className={styles.userRow}>
          <Image
            className={styles.avatar}
            src={u.avatarUrl || AVATAR_DEFAULT}
            mode="aspectFill"
            onClick={handleLogin}
          />
          <View className={styles.userInfo}>
            <Text className={styles.nickname} onClick={handleLogin}>
              {u.nickName}
            </Text>
            <Text className={styles.uid}>
              {user?.openid ? `UID · ${(user.openid).slice(-8)}` : '登录后同步数据到云端'}
            </Text>
            <Text className={styles.vipTag}>🌱 穿搭萌新</Text>
          </View>
          <View
            className={styles.settingBtn}
            onClick={() => Taro.showToast({ title: '设置功能开发中', icon: 'none' })}
          >
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none">
              <path
                d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
                stroke="white"
                strokeWidth="1.8"
              />
              <path
                d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
                stroke="white"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
          </View>
        </View>

        {/* 悬浮统计条 */}
        <View className={styles.statsBar}>
          <View className={styles.statItem}>
            <Text className={styles.statNum}>{loading ? '-' : totalPlans}</Text>
            <Text className={styles.statLabel}>穿搭方案</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statNum}>{loading ? '-' : totalDays}</Text>
            <Text className={styles.statLabel}>穿搭天数</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statNum}>{loading ? '-' : totalCities}</Text>
            <Text className={styles.statLabel}>探索城市</Text>
          </View>
        </View>
      </View>

      {/* 内容区 */}
      <View className={styles.contentSection}>
        <View className={styles.sectionCard}>
          {menuItems.map((item) => (
            <View className={styles.menuItem} key={item.id} onClick={item.onClick}>
              <View className={styles.menuIcon}>{item.icon}</View>
              <View className={styles.menuContent}>
                <Text className={styles.menuTitle}>{item.title}</Text>
                {item.desc && <Text className={styles.menuDesc}>{item.desc}</Text>}
              </View>
              {item.badge && <Text className={styles.menuBadge}>{item.badge}</Text>}
              <svg className={styles.menuArrow} viewBox="0 0 24 24" width="18" height="18" fill="none">
                <path
                  d="M9 6L15 12L9 18"
                  stroke="#C9CDD4"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </View>
          ))}
        </View>

        {/* 空状态占位提示（仅当用户没有任何数据时展示）*/}
        {!loading && totalPlans === 0 && (
          <EmptyState
            title="还没有穿搭记录"
            desc="点击下方按钮，开始你的第一次穿搭设计吧"
            actionText="立即设计"
            onAction={() => goPage('/pages/plan/index')}
          />
        )}
      </View>

      {/* 退出登录 */}
      <View className={styles.logoutWrap}>
        {user && (
          <Button className={styles.logoutBtn} onClick={handleLogout}>
            退出登录
          </Button>
        )}
      </View>

      <View className={styles.footer}>
        <Text className={styles.footerText}>每日穿搭 · AI 旅行穿搭助手</Text>
        <Text className={styles.footerText}>© 2026 Daily Style Guide</Text>
      </View>
    </ScrollView>
  );
};

export default MinePage;
