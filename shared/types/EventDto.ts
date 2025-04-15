import { Event } from './db.types';

/**
 * DTO representing an event.
 * Dates are represented as strings in ISO 8601 format.
 */
export interface EventDto extends Omit<Event, 'start_time' | 'created_at' | 'updated_at'> {
  /** Event start time in ISO 8601 format. */
  start_time: string;
   /** Creation timestamp in ISO 8601 format. */
  created_at: string;
   /** Last update timestamp in ISO 8601 format. */
  updated_at: string;
} 