// Adjust path if needed

import { AttendeeDetailsDto } from '../../types/AttendeeDetailsDto';
import { EventDto } from '../../types/EventDto';

// Define the shape of the event slice state
export interface EventState {
  selectedEvent: EventDto | null;
  attendees: Record<string, AttendeeDetailsDto[]>;
  events: EventDto[];
}

// Define the initial state for the event slice
export const initialState: EventState = {
  selectedEvent: null,
  attendees: {},
  events: [],
};
