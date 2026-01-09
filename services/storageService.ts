
import { Visit, VisitorCategory, LocationType } from '../types';

const VISITS_KEY = 'artemis_visits_v2';
const RESET_STATE_KEY = 'artemis_reset_state_v2';

interface ResetState {
  lastDailyReset: string;
  lastWeeklyReset: string;
  lastMonthlyReset: string;
  lastYearlyReset: string;
  currentDailyCount: number;
  currentWeeklyCount: number;
  currentMonthlyCount: number;
  currentYearlyCount: number;
}

const getInitialResetState = (): ResetState => ({
  lastDailyReset: new Date(0).toISOString(),
  lastWeeklyReset: new Date(0).toISOString(),
  lastMonthlyReset: new Date(0).toISOString(),
  lastYearlyReset: new Date(0).toISOString(),
  currentDailyCount: 0,
  currentWeeklyCount: 0,
  currentMonthlyCount: 0,
  currentYearlyCount: 0,
});

export const storageService = {
  getVisits: (): Visit[] => {
    const data = localStorage.getItem(VISITS_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveVisit: (
    category: VisitorCategory, 
    location: LocationType, 
    groupInfo?: string, 
    groupSize: number = 1
  ): Visit => {
    const visits = storageService.getVisits();
    const resetStateStr = localStorage.getItem(RESET_STATE_KEY);
    let state: ResetState = resetStateStr ? JSON.parse(resetStateStr) : getInitialResetState();

    const now = new Date();

    // 1. Daily Reset Logic (Midnight 00:00)
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    if (new Date(state.lastDailyReset).getTime() < startOfDay.getTime()) {
      state.currentDailyCount = 0;
      state.lastDailyReset = startOfDay.toISOString();
    }

    // 2. Weekly Reset Logic (Sunday 00:00)
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    if (new Date(state.lastWeeklyReset).getTime() < startOfWeek.getTime()) {
      state.currentWeeklyCount = 0;
      state.lastWeeklyReset = startOfWeek.toISOString();
    }

    // 3. Monthly Reset Logic (1st 00:00)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    if (new Date(state.lastMonthlyReset).getTime() < startOfMonth.getTime()) {
      state.currentMonthlyCount = 0;
      state.lastMonthlyReset = startOfMonth.toISOString();
    }

    // 4. Yearly Reset Logic (Jan 1st 00:00)
    const startOfYear = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
    if (new Date(state.lastYearlyReset).getTime() < startOfYear.getTime()) {
      state.currentYearlyCount = 0;
      state.lastYearlyReset = startOfYear.toISOString();
    }

    // Increment all by groupSize
    state.currentDailyCount += groupSize;
    state.currentWeeklyCount += groupSize;
    state.currentMonthlyCount += groupSize;
    state.currentYearlyCount += groupSize;

    const newVisit: Visit = {
      id: crypto.randomUUID(),
      category,
      location,
      timestamp: now.toISOString(),
      dailyNumber: state.currentDailyCount,
      weeklyNumber: state.currentWeeklyCount,
      monthlyNumber: state.currentMonthlyCount,
      yearlyNumber: state.currentYearlyCount,
      groupInfo,
      groupSize
    };

    localStorage.setItem(VISITS_KEY, JSON.stringify([newVisit, ...visits]));
    localStorage.setItem(RESET_STATE_KEY, JSON.stringify(state));

    return newVisit;
  },

  clearAllData: () => {
    localStorage.removeItem(VISITS_KEY);
    localStorage.removeItem(RESET_STATE_KEY);
  }
};
