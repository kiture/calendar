import { EventAttendance } from './db.types';

/**
 * DTO representing an event attendance record.
 * Dates are represented as strings in ISO 8601 format.
 */
export interface EventAttendanceDto extends Omit<EventAttendance, 'joined_at'> {
   /** Timestamp when the user joined the event (ISO 8601 format). */
  joined_at: string;
} 