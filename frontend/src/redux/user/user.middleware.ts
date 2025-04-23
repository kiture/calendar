import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';
import type { RootState, AppDispatch } from '../store'; // Import AppDispatch
import { loginUser, fetchAllRoles, fetchAllUsers } from './user.thunks';
import { selectIsLoggedIn, selectUserIsAdmin } from './user.selectors';

// Import user-specific actions or thunks you might want to listen to
// Example: import { updateUser.fulfilled } from './user.thunks';

// Create the middleware instance specific to the user slice
export const userListenerMiddleware = createListenerMiddleware();

userListenerMiddleware.startListening({
  matcher: isAnyOf(loginUser.fulfilled),
  effect: async (action, listenerApi) => {
    // Get the state *after* the login action was processed
    const state = listenerApi.getState() as RootState;

    // Use the selector to check the login status from the updated state
    const isLoggedIn = selectIsLoggedIn(state);

    // You can now conditionally run logic based on the selector result
    if (isLoggedIn) {
      // Explicitly type the dispatch from listenerApi
      const dispatch = listenerApi.dispatch as AppDispatch;
      // Dispatch fetchAllRoles thunk using the typed dispatch
      dispatch(fetchAllRoles());
      // Add any other post-login actions here...
    }
  },
});

userListenerMiddleware.startListening({
  matcher: isAnyOf(fetchAllRoles.fulfilled),
  effect: async (_, listenerApi) => {
    const state = listenerApi.getState() as RootState;
    const isAdmin = selectUserIsAdmin(state);
    if (isAdmin) {
      const dispatch = listenerApi.dispatch as AppDispatch;
      dispatch(fetchAllUsers());
    }
  },
});
