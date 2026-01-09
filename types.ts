
/**
 * VisitorCategory defines the types of people who can log in.
 * Enums are used here to ensure type safety and avoid typos in the code.
 */
export enum VisitorCategory {
  STUDENT = 'Student',
  VISITOR = 'Visitor',
  LAWATAN = 'Lawatan'
}

/**
 * LocationType identifies the specific venue being visited.
 */
export enum LocationType {
  MUSEUM = 'Museum',
  ARTS_GALLERY = 'Arts Gallery'
}

/**
 * The Visit interface describes the structure of a single visit record.
 * This is used to ensure every visit object has the same properties.
 */
export interface Visit {
  id: string; // Unique identifier for the record
  category: VisitorCategory;
  location: LocationType;
  timestamp: string; // ISO string format for easy sorting and date parsing
  dailyNumber: number; // The ticket number for that day
  weeklyNumber: number;
  monthlyNumber: number;
  yearlyNumber: number;
  groupInfo?: string; // Optional: used only for Lawatan (group) visits
  groupSize?: number; // Optional: used to count multiple people at once
}

/**
 * CounterStats represents the summary totals shown on the dashboard.
 */
export interface CounterStats {
  daily: number;
  weekly: number;
  monthly: number;
  yearly: number;
  allTime: number;
}
