import { create } from 'zustand';
import type { UserInfo, CityInfo, DailyOutfit, StyleKey } from '@/types';

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
  draftOccasion: string;
  draftAvoid: string;
  draftDailyList: DailyOutfit[];

  setDraftDestination: (d: CityInfo | null) => void;
  setDraftDate: (start: string, end: string) => void;
  setDraftStyle: (s: string) => void;
  setDraftColor: (c: string) => void;
  setDraftOccasion: (o: string) => void;
  setDraftAvoid: (a: string) => void;
  setDraftDailyList: (list: DailyOutfit[]) => void;
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
  draftOccasion: '',
  draftAvoid: '',
  draftDailyList: [],

  setDraftDestination: (d) => set({ draftDestination: d }),
  setDraftDate: (s, e) => set({ draftStartDate: s, draftEndDate: e }),
  setDraftStyle: (s) => set({ draftStyle: s }),
  setDraftColor: (c) => set({ draftColor: c }),
  setDraftOccasion: (o) => set({ draftOccasion: o }),
  setDraftAvoid: (a) => set({ draftAvoid: a }),
  setDraftDailyList: (list) => set({ draftDailyList: list }),
  resetDraft: () =>
    set({
      draftDestination: null,
      draftDailyList: [],
      draftColor: '',
      draftOccasion: '',
      draftAvoid: ''
    })
}));
