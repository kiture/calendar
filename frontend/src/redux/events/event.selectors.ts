import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';
import { EventState } from './event.model';

// Select the event slice from the root state
const selectEventSlice = (state: RootState): EventState => state.events; // Assuming 'event' is the key in RootState

// Select the currently selected event details
export const selectSelectedEvent = createSelector(
  [selectEventSlice],
  (eventsState) => eventsState.selectedEvent
);

// Select the list of attendees for the currently selected event
export const selectEventAttendees = createSelector(
  [selectEventSlice],
  (eventsState) => eventsState.attendees
);

export const selectEventAttendeesByEventId = (eventId: string) =>
  createSelector(
    [selectEventSlice],
    (eventsState) => eventsState.attendees[eventId]
  );

// Select the list of events
export const selectEvents = createSelector(
  [selectEventSlice],
  (eventsState) => eventsState.events
);

// Select the list of events in a specific group
export const selectEventsInGroup = (groupId: string) =>
  createSelector([selectEventSlice], (eventsState) =>
    eventsState.events.filter((event) => event.group_id === groupId)
  );
