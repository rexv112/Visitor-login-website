
export enum VisitorCategory {
  STUDENT = 'Student',
  VISITOR = 'Visitor'
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
  dailyNumber: number;
}

export interface CounterStats {
  daily: number;
  weekly: number;
  monthly: number;
  yearly: number;
  allTime: number;
}
