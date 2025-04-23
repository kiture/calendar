import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';
import { EventState } from './event.model';
import { selectSelectedGroupId } from '../group/group.selectors';
import { selectCurrentUser } from '../user/user.selectors';

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

export const selectCurrentUserEvents = createSelector(
  [selectEvents, selectCurrentUser, selectEventAttendees],
  (events, currentUser, attendees) => {
    return events.filter((event) =>
      attendees[event.event_id]?.some(
        (attendee) => attendee.user_id === currentUser?.user_id
      )
    );
  }
);

export const selectEventById = (eventId: string | number) =>
  createSelector([selectEvents], (events) => {
    return events.find((event) => String(event.event_id) === String(eventId));
  });

// Select the list of events in a specific group
export const selectEventsInGroup = (groupId: string) =>
  createSelector([selectEventSlice], (eventsState) =>
    eventsState.events.filter((event) => event.group_id === groupId)
  );

export const selectEventsForActiveGroup = createSelector(
  [selectEventSlice, selectSelectedGroupId],
  (eventsState, selectedGroupId) =>
    eventsState.events.filter((event) => event.group_id === selectedGroupId)
);

export const selectUserIsAttendingEvent = (eventId: string) =>
  createSelector(
    [selectCurrentUser, selectEventAttendeesByEventId(eventId)],
    (currentUser, attendees) =>
      attendees?.some((attendee) => attendee.user_id === currentUser?.user_id)
  );
