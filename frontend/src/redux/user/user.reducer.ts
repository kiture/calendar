import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { initialState } from './user.model';
import { LoginResponseDto } from '../../types/LoginResponseDto';
import { loginUser, fetchAllUsers, fetchAllRoles } from './user.thunks';
import { ListUsersResponseDto } from '../../types/ListUsersResponseDto';
import { RoleDto } from '../../types/RoleDto';

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    logoutUser: (state) => {
      state.user = null;
      state.accessToken = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.user = null;
        state.accessToken = null;
      })
      .addCase(
        loginUser.fulfilled,
        (state, action: PayloadAction<LoginResponseDto>) => {
          state.user = action.payload.user;
          state.accessToken = action.payload.accessToken;
        }
      )
      .addCase(loginUser.rejected, (state) => {
        state.user = null;
        state.accessToken = null;
      })
      .addCase(
        fetchAllUsers.fulfilled,
        (state, action: PayloadAction<ListUsersResponseDto>) => {
          state.users = action.payload.users;
        }
      )
      .addCase(
        fetchAllRoles.fulfilled,
        (state, action: PayloadAction<RoleDto[]>) => {
          state.roles = action.payload;
        }
      );
  },
});

export const { logoutUser } = userSlice.actions;
export default userSlice.reducer;
