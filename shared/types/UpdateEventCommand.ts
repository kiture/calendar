import { Event } from './db.types';

/**
 * Command model for updating an event. All fields are optional.
 */
export type UpdateEventCommand = Partial<
  Pick<Event, 'title' | 'place' | 'description'> & {
    /** Event start time in ISO 8601 string format. */
    start_time: string;
  }
>; 