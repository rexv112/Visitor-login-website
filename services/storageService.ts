
import { Visit, VisitorCategory, LocationType } from '../types';

// Constants for local storage keys to keep them consistent
const VISITS_KEY = 'artemis_visits_v2';
const RESET_STATE_KEY = 'artemis_reset_state_v2';

/**
 * ResetState tracks the current counters and the last time they were cleared.
 */
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

// Default values when the app is opened for the first time
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
  // Retrieves the list of visits from the browser's local storage
  getVisits: (): Visit[] => {
    const data = localStorage.getItem(VISITS_KEY);
    return data ? JSON.parse(data) : [];
  },

  // Main logic for saving a new visitor and updating counters
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

    // Reset logic: Checks if the current time has passed the last reset threshold.
    
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

    // 3. Monthly Reset Logic (1st day of month 00:00)
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

    // Increment current counters by the size of the visitor group
    state.currentDailyCount += groupSize;
    state.currentWeeklyCount += groupSize;
    state.currentMonthlyCount += groupSize;
    state.currentYearlyCount += groupSize;

    // Create the new visit record
    const newVisit: Visit = {
      id: crypto.randomUUID(), // Generates a unique ID for the database
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

    // Save back to local storage (Simulates a database save)
    localStorage.setItem(VISITS_KEY, JSON.stringify([newVisit, ...visits]));
    localStorage.setItem(RESET_STATE_KEY, JSON.stringify(state));

    return newVisit;
  },

  // Helper function to clear all data during testing
  clearAllData: () => {
    localStorage.removeItem(VISITS_KEY);
    localStorage.removeItem(RESET_STATE_KEY);
  }
};
