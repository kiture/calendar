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

export const selectRoles = createSelector(
  [selectUserSlice],
  (userState) => userState.roles
);

export const selectUserRole = createSelector(
  [selectUserSlice, selectRoles],
  (userState, roles) =>
    roles.find((role) => role.role_id === userState.user?.role_id)
);

export const selectUserIsAdmin = createSelector(
  [selectUserRole],
  (role) => role?.role_name === 'admin'
);
