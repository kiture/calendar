import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';
import type { AppDispatch, RootState } from '../store'; // Import RootState type if needed for effects
import { fetchUserGroups } from '../group/group.thunks';
import { selectUserGroups } from '../group/group.selectors';
import { listEventsInGroup, listAttendees } from './event.thunks';
import { selectEvents } from './event.selectors';

// Import event-specific actions or thunks you might want to listen to
// Example: import { fetchEvents } from './event.thunks';

// Create the middleware instance specific to events
export const eventListenerMiddleware = createListenerMiddleware();

eventListenerMiddleware.startListening({
  matcher: isAnyOf(fetchUserGroups.fulfilled),
  effect: async (_, listenerApi) => {
    const state = listenerApi.getState() as RootState;
    const groups = selectUserGroups(state);
    if (groups.length !== 0) {
      const dispatch = listenerApi.dispatch as AppDispatch;
      groups.forEach((group) => {
        dispatch(listEventsInGroup({ groupId: group.group_id }));
      });
    }
  },
});

eventListenerMiddleware.startListening({
  matcher: isAnyOf(listEventsInGroup.fulfilled),
  effect: async (_, listenerApi) => {
    const state = listenerApi.getState() as RootState;
    const events = selectEvents(state);
    if (events.length !== 0) {
      const dispatch = listenerApi.dispatch as AppDispatch;
      events.forEach((event) => {
        dispatch(listAttendees(event.event_id));
      });
    }
  },
});