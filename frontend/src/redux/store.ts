import { configureStore } from '@reduxjs/toolkit';
import appReducer from './app/app.reducer';
import userReducer from './user/user.reducer';
import groupReducer from './group/group.reducer';
import eventReducer from './events/event.reducer';
export const store = configureStore({
  reducer: {
    app: appReducer,
    user: userReducer,
    group: groupReducer,
    events: eventReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;

export type AppDispatch = typeof store.dispatch;
