import { configureStore } from '@reduxjs/toolkit';
import appReducer from './app/app.reducer';
import userReducer from './user/user.reducer';
import groupReducer from './group/group.reducer';
import eventReducer from './events/event.reducer';
import { appListenerMiddleware } from './app/app.middleware';
import { eventListenerMiddleware } from './events/event.middleware';
import { groupListenerMiddleware } from './group/group.middleware';
import { userListenerMiddleware } from './user/user.middleware';

export const store = configureStore({
  reducer: {
    app: appReducer,
    user: userReducer,
    group: groupReducer,
    events: eventReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().prepend(
      appListenerMiddleware.middleware,
      eventListenerMiddleware.middleware,
      groupListenerMiddleware.middleware,
      userListenerMiddleware.middleware
    ),
});

export type RootState = ReturnType<typeof store.getState>;

export type AppDispatch = typeof store.dispatch;
