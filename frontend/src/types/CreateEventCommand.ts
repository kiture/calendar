import { Event } from './db.types';

/**
 * Command model for creating a new event within a group.
 */
export interface CreateEventCommand
  extends Pick<Event, 'title'>,
    Partial<Pick<Event, 'place' | 'description' | 'is_ai_suggestion'>> {
  /** Event start time in ISO 8601 string format. */
  start_time: string;
  /** Event end time in ISO 8601 string format. */
  end_time: string;
}
