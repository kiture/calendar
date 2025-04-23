import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';
import { AppState } from './app.model';

const selectAppSlice = (state: RootState): AppState => state.app;

export const selectAppTitle = createSelector(
  [selectAppSlice],
  (appState) => appState.appTitle
);

export const selectAppStatus = createSelector(
  [selectAppSlice],
  (appState) => appState.status
);

export const selectAppError = createSelector(
  [selectAppSlice],
  (appState): string | null => {
    if (appState.status?.type === 'error') {
      return appState.status.error;
    }
    return null;
  }
);

export const selectAppLoading = createSelector(
  [selectAppSlice],
  (appState): string | null => {
    return appState.status?.type === 'loading' ? appState.status.info : null;
  }
);
