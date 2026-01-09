
export enum VisitorCategory {
  STUDENT = 'Student',
  VISITOR = 'Visitor',
  LAWATAN = 'Lawatan'
}

export enum LocationType {
  MUSEUM = 'Museum',
  ARTS_GALLERY = 'Arts Gallery'
}

export interface Visit {
  id: string;
  category: VisitorCategory;
  location: LocationType;
  timestamp: string; // ISO string
  dailyNumber: number; // This stores the END number of the count for this entry
  weeklyNumber: number;
  monthlyNumber: number;
  yearlyNumber: number;
  groupInfo?: string; // e.g., School name
  groupSize?: number; // Total number of people in the group
}

export interface CounterStats {
  daily: number;
  weekly: number;
  monthly: number;
  yearly: number;
  allTime: number;
}
