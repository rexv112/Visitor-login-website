
import { Visit, VisitorCategory, LocationType } from '../types';

const VISITS_KEY = 'artemis_visits_v1';
const RESET_STATE_KEY = 'artemis_reset_state';

interface ResetState {
  lastResetAt: string; // ISO string
  currentDailyNumber: number;
}

/**
 * Calculates if we need to reset the daily counter based on the 12:00 PM rule.
 */
const shouldResetDailyNumber = (lastResetAt: string): boolean => {
  const now = new Date();
  const lastReset = new Date(lastResetAt);
  
  // Define "Today at 12:00 PM"
  const todayNoon = new Date(now);
  todayNoon.setHours(12, 0, 0, 0);

  // If we haven't reset since before today's 12:00 PM AND it's now after 12:00 PM
  if (lastReset < todayNoon && now >= todayNoon) {
    return true;
  }
  
  // If last reset was on a previous day and we haven't hit noon yet today, 
  // but we are still in a new "cycle" (e.g. it's 8 AM today and last reset was 12 PM yesterday),
  // we actually keep the same number until 12 PM today.
  
  // Simple check: if different calendar days and it's past 12 PM
  const isDifferentDay = lastReset.toDateString() !== now.toDateString();
  if (isDifferentDay && now >= todayNoon) return true;

  return false;
};

export const storageService = {
  getVisits: (): Visit[] => {
    const data = localStorage.getItem(VISITS_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveVisit: (category: VisitorCategory, location: LocationType): Visit => {
    const visits = storageService.getVisits();
    const resetStateStr = localStorage.getItem(RESET_STATE_KEY);
    let resetState: ResetState = resetStateStr 
      ? JSON.parse(resetStateStr) 
      : { lastResetAt: new Date(0).toISOString(), currentDailyNumber: 0 };

    // Check if we need to reset daily counter (at 12:00 PM)
    if (shouldResetDailyNumber(resetState.lastResetAt)) {
      resetState.currentDailyNumber = 0;
      // We set the lastResetAt to today at 12:00 PM to mark the start of the new window
      const todayNoon = new Date();
      todayNoon.setHours(12, 0, 0, 0);
      resetState.lastResetAt = todayNoon.toISOString();
    }

    resetState.currentDailyNumber += 1;
    
    const newVisit: Visit = {
      id: crypto.randomUUID(),
      category,
      location,
      timestamp: new Date().toISOString(),
      dailyNumber: resetState.currentDailyNumber
    };

    const updatedVisits = [newVisit, ...visits];
    localStorage.setItem(VISITS_KEY, JSON.stringify(updatedVisits));
    localStorage.setItem(RESET_STATE_KEY, JSON.stringify(resetState));

    return newVisit;
  },

  clearAllData: () => {
    localStorage.removeItem(VISITS_KEY);
    localStorage.removeItem(RESET_STATE_KEY);
  }
};
