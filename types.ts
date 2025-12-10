export enum EventCategory {
  MILESTONE = 'MILESTONE',
  TODO = 'TODO',
  MEDICAL = 'MEDICAL',
  FACT = 'FACT',
  OTHER = 'OTHER'
}

export type EventType = 'standard' | 'marker';

export type IconName = 'baby' | 'star' | 'heart' | 'check' | 'alert' | 'gift' | 'flag' | 'calendar' | 'zap';

export interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  date: string; // ISO String YYYY-MM-DD
  endDate?: string; // Optional for ranges
  category: EventCategory;
  color: string;
  row?: number; // Calculated for layout
  isCompleted?: boolean; // New property for task tracking
  type: EventType; // Standard card or Visual Marker
  icon?: IconName; // Icon for markers
}

export interface TimelineSettings {
  zoomLevel: number; // Pixels per day
  dueDate: Date;
}

export const DEFAULT_COLORS = {
  [EventCategory.MILESTONE]: '#f59e0b', // Amber
  [EventCategory.TODO]: '#3b82f6', // Blue
  [EventCategory.MEDICAL]: '#8b5cf6', // Violet
  [EventCategory.FACT]: '#ef4444', // Red
  [EventCategory.OTHER]: '#10b981', // Emerald
};