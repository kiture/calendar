import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { initialState, AppStatus } from './app.model';
import { loadAppConfig } from '../../service/config.service';

export const initializeApp = createAsyncThunk(
  'app/initializeApp',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setAppStatus({ type: 'initializing' }));
      await loadAppConfig();
      dispatch(setAppIdle());
      return true;
    } catch (error) {
      console.error('Application initialization failed:', error);
      return rejectWithValue('Initialization failed');
    }
  }
);

export const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setAppStatus: (state, action: PayloadAction<AppStatus>) => {
      state.status = action.payload;
    },
    setAppIdle: (state) => {
      state.status = { type: 'idle' };
    },
    setAppLoading: (state, action: PayloadAction<string>) => {
      state.status = { type: 'loading', info: action.payload };
    },
    setAppError: (state, action: PayloadAction<string>) => {
      state.status = { type: 'error', error: action.payload };
    },
    setAppInitializing: (state) => {
      state.status = { type: 'initializing' };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeApp.pending, (state) => {
        state.status = { type: 'initializing' };
      })
      .addCase(initializeApp.fulfilled, (state) => {
        state.status = { type: 'idle' };
      })
      .addCase(initializeApp.rejected, (state, action) => {
        state.status = {
          type: 'error',
          error: (action.payload as string) || 'Initialization failed',
        };
      });
  },
});

export const {
  setAppStatus,
  setAppIdle,
  setAppLoading,
  setAppError,
  setAppInitializing,
} = appSlice.actions;

export default appSlice.reducer;
