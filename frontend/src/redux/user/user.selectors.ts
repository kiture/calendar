import { RootState } from '../store';
import { createSelector } from '@reduxjs/toolkit';

const selectUserSlice = (state: RootState) => state.user;

export const selectCurrentUser = createSelector(
  [selectUserSlice],
  (userState) => userState.user
);

export const selectAccessToken = createSelector(
  [selectUserSlice],
  (userState) => userState.accessToken
);

export const selectIsLoggedIn = createSelector(
  [selectUserSlice],
  (userState) => !!userState.accessToken
);
