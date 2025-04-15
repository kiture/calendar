import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { AppState } from '../../model/AppState';
import { getConfig } from '../../service/config.service';

const initialState: AppState = {
  appTitle: 'Events Calendar',
  user: null,
  status: null,
};

export const fetchUser = createAsyncThunk(
  'app/fetchUser',
  async ({ name, password }: { name: string; password: string }) => {
    const config = getConfig();
    const response = await fetch(`${config.apiUrl}/api/user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, password }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user');
    }

    return response.json();
  }
);

export const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.status = null;
      })
      .addCase(fetchUser.rejected, (state, action) => {
        state.user = null;
        state.status = { error: action.error.message || 'Unknown error' };
      })
      .addCase(fetchUser.pending, (state) => {
        state.user = null;
        state.status = { loading: true };
      });
  },
});

export const { setUser } = appSlice.actions;

export default appSlice.reducer;
