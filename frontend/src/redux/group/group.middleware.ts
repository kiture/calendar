import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';
import type { AppDispatch, RootState } from '../store'; // Import RootState type if needed for effects
import {
  fetchUserGroups,
  fetchAllGroups,
  fetchGroupMembers,
} from './group.thunks';
import { fetchAllRoles, loginUser } from '../user/user.thunks';
import { selectIsLoggedIn, selectUserIsAdmin } from '../user/user.selectors';
import { selectUserGroups } from './group.selectors';

// Import group-specific actions or thunks you might want to listen to
// Example: import { createGroup } from './group.thunks';

// Create the middleware instance specific to groups
export const groupListenerMiddleware = createListenerMiddleware();

groupListenerMiddleware.startListening({
  matcher: isAnyOf(loginUser.fulfilled),
  effect: async (_, listenerApi) => {
    // Get the state *after* the login action was processed
    const state = listenerApi.getState() as RootState;

    // Use the selector to check the login status from the updated state
    const isLoggedIn = selectIsLoggedIn(state);

    // You can now conditionally run logic based on the selector result
    if (isLoggedIn) {
      const dispatch = listenerApi.dispatch as AppDispatch;
      dispatch(fetchUserGroups());
    }
  },
});

groupListenerMiddleware.startListening({
  matcher: isAnyOf(fetchUserGroups.fulfilled),
  effect: async (_, listenerApi) => {
    const state = listenerApi.getState() as RootState;
    const groups = selectUserGroups(state);
    if (groups.length !== 0) {
      const dispatch = listenerApi.dispatch as AppDispatch;
      groups.forEach((group) => {
        dispatch(fetchGroupMembers(group.group_id));
      });
    }
  },
});

groupListenerMiddleware.startListening({
  matcher: isAnyOf(fetchAllRoles.fulfilled),
  effect: async (_, listenerApi) => {
    const state = listenerApi.getState() as RootState;
    const isAdmin = selectUserIsAdmin(state);
    if (isAdmin) {
      const dispatch = listenerApi.dispatch as AppDispatch;
      dispatch(fetchAllGroups());
    }
  },
});
