import { create } from 'zustand';
import type { UserInfo, CityInfo, DailyOutfit, StyleKey, TripForecastDay } from '@/types';
import type { TripColorKey, TripStyleKey } from '@/features/trip/preferences';

interface AppState {
  // 用户
  user: UserInfo | null;
  setUser: (u: UserInfo | null) => void;

  // 当前穿搭草稿（设计流程用）
  draftDestination: CityInfo | null;
  draftStartDate: string;
  draftEndDate: string;
  draftStyle: StyleKey | string;
  draftColor: string;
  draftStyles: TripStyleKey[];
  draftColors: TripColorKey[];
  draftOccasion: string;
  draftAvoid: string;
  draftDailyList: DailyOutfit[];
  draftForecast: TripForecastDay[];

  setDraftDestination: (d: CityInfo | null) => void;
  setDraftDate: (start: string, end: string) => void;
  setDraftStyle: (s: string) => void;
  setDraftColor: (c: string) => void;
  setDraftStyles: (styles: TripStyleKey[]) => void;
  setDraftColors: (colors: TripColorKey[]) => void;
  setDraftOccasion: (o: string) => void;
  setDraftAvoid: (a: string) => void;
  setDraftDailyList: (list: DailyOutfit[]) => void;
  setDraftForecast: (list: TripForecastDay[]) => void;
  resetDraft: () => void;
}

const today = new Date();
const start = today.toISOString().slice(0, 10);
const endDate = new Date(today);
endDate.setDate(endDate.getDate() + 3);
const end = endDate.toISOString().slice(0, 10);

export const useAppStore = create<AppState>((set) => ({
  user: null,
  setUser: (u) => set({ user: u }),

  draftDestination: null,
  draftStartDate: start,
  draftEndDate: end,
  draftStyle: 'minimal',
  draftColor: '',
  draftStyles: [],
  draftColors: [],
  draftOccasion: '',
  draftAvoid: '',
  draftDailyList: [],
  draftForecast: [],

  setDraftDestination: (d) => set({ draftDestination: d }),
  setDraftDate: (s, e) => set({ draftStartDate: s, draftEndDate: e }),
  setDraftStyle: (s) => set({ draftStyle: s }),
  setDraftColor: (c) => set({ draftColor: c }),
  setDraftStyles: (styles) => set({ draftStyles: styles }),
  setDraftColors: (colors) => set({ draftColors: colors }),
  setDraftOccasion: (o) => set({ draftOccasion: o }),
  setDraftAvoid: (a) => set({ draftAvoid: a }),
  setDraftDailyList: (list) => set({ draftDailyList: list }),
  setDraftForecast: (list) => set({ draftForecast: list }),
  resetDraft: () =>
    set({
      draftDestination: null,
      draftDailyList: [],
      draftForecast: [],
      draftColor: '',
      draftStyles: [],
      draftColors: [],
      draftOccasion: '',
      draftAvoid: ''
    })
}));
