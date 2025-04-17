import { User } from './db.types';

/**
 * DTO representing detailed information about an event attendee.
 * Combines user details with event attendance join date.
 */
export interface AttendeeDetailsDto
  extends Pick<User, 'user_id' | 'login' | 'first_name' | 'last_name'> {
  /** The date the user marked attendance for the event (ISO 8601 format). */
  joined_at: string; // From EventAttendance, represented as string
  event_id: string;
}
