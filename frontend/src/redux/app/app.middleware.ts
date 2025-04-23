import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';
import type { RootState } from '../store'; // Import RootState type
import { loginUser } from '../user/user.thunks'; // Import the thunk
import { selectIsLoggedIn } from '../user/user.selectors'; // Import the selector
// Import other actions or thunks you want to listen to here
// Example: import { fetchUserProfile } from '../user/profile.thunks';

// Create the middleware instance
export const appListenerMiddleware = createListenerMiddleware();

// Start listening for specific actions

// Listener for successful user login
appListenerMiddleware.startListening({
  matcher: isAnyOf(loginUser.fulfilled),
  effect: async (_, listenerApi) => {
    // Get the state *after* the login action was processed
    const state = listenerApi.getState() as RootState;

    // Use the selector to check the login status from the updated state
    const isLoggedIn = selectIsLoggedIn(state);

    // You can now conditionally run logic based on the selector result
    if (isLoggedIn) {
      console.log('Login successful (listenerMiddleware)');
    }
  },
});

// Add more listeners here for other actions as needed...
// Example:
// appListenerMiddleware.startListening({
//   actionCreator: someOtherAction,
//   effect: async (action, listenerApi) => { ... }
// });
