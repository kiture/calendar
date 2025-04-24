import { createAsyncThunk } from '@reduxjs/toolkit';
import { getConfig } from '../../service/config.service';
import {
  LoginCommand,
  CreateUserCommand,
  UserDto,
  ListUsersResponseDto,
  LoginResponseDto,
  RoleDto,
} from '../../types';
import { setAppError, setAppIdle, setAppLoading } from '../app/app.reducer';
import { AppDispatch, RootState } from '../store';
import { makeApiRequest } from '../../utils/fetch-helper';

type AsyncThunkConfig = {
  state: RootState;
  dispatch: AppDispatch;
  getState: () => RootState;
  rejectValue: string;
};

export const loginUser = createAsyncThunk<
  LoginResponseDto,
  LoginCommand,
  { rejectValue: string; dispatch: AppDispatch }
>(
  'user/login',
  async (loginCommand: LoginCommand, { dispatch, rejectWithValue }) => {
    dispatch(setAppLoading('Logging in...'));
    const config = getConfig();
    try {
      const response = await fetch(`${config.apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginCommand),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage =
          errorData?.message || `Login failed with status: ${response.status}`;
        dispatch(setAppError(errorMessage));
        return rejectWithValue(errorMessage);
      }

      const data: LoginResponseDto = await response.json();
      dispatch(setAppIdle());
      return data;
    } catch (error: unknown) {
      let message = 'An unknown error occurred during login';
      if (error instanceof Error) {
        message = error.message;
      }
      dispatch(setAppError(message));
      return rejectWithValue(message);
    }
  }
);

export const createUser = createAsyncThunk<
  UserDto,
  CreateUserCommand,
  AsyncThunkConfig
>('user/createUser', async (userData, thunkAPI) => {
  return makeApiRequest<UserDto>('/api/users', 'POST', thunkAPI, {
    data: userData,
    loadingMessage: 'Creating user...',
    tokenRequired: false,
  });
});

// Thunk to fetch all users (Admin operation)
export const fetchAllUsers = createAsyncThunk<
  ListUsersResponseDto, // Return type on success
  void, // Argument type (no args for now)
  AsyncThunkConfig
>('user/fetchAllUsers', async (_, thunkAPI) => {
  // Note: This currently fetches all users without pagination args.
  // Modify makeApiRequest or use manual fetch if limit/offset are needed.
  return makeApiRequest<ListUsersResponseDto>(
    '/api/admin/users', // Admin endpoint for listing users
    'GET', // Method
    thunkAPI, // Pass the thunk API object
    { loadingMessage: 'Fetching all users...' } // Options
  );
});

// Thunk to fetch a single user by ID (Admin operation)
export const fetchUserById = createAsyncThunk<
  UserDto, // Return type on success
  string, // Argument type (userId)
  AsyncThunkConfig
>('user/fetchById', async (userId, thunkAPI) => {
  return makeApiRequest<UserDto>(
    `/api/admin/users/${userId}`, // Dynamic URL path
    'GET', // Method
    thunkAPI, // Pass the thunk API object
    { loadingMessage: `Fetching user ${userId}...` } // Options
  );
});

// Thunk to update a user (Admin operation)
export const updateUser = createAsyncThunk<
  UserDto, // Return type on success (updated user)
  { userId: string; updates: UserDto }, // Argument type: userId and update data
  AsyncThunkConfig
>('user/updateUser', async ({ userId, updates }, thunkAPI) => {
  return makeApiRequest<UserDto>(
    `/api/admin/users/${userId}`, // Construct URL with userId
    'PUT', // HTTP Method
    thunkAPI, // Pass thunk API context
    {
      data: updates, // Pass the update data as the request body
      loadingMessage: `Updating user ${userId}...`, // Loading message for UI
    }
  );
});

// Thunk to delete a user (Admin operation)
export const deleteUser = createAsyncThunk<
  string, // Return userId on success
  string, // Argument type (userId)
  AsyncThunkConfig
>('user/deleteUser', async (userId, thunkAPI) => {
  // makeApiRequest returns {} on 204 success
  const result = await makeApiRequest<void>(
    `/api/admin/users/${userId}`, // Dynamic URL path
    'DELETE', // Method
    thunkAPI, // Pass the thunk API object
    { loadingMessage: `Deleting user ${userId}...` } // Options
  );

  // If makeApiRequest did not return the rejectWithValue action payload,
  // it means the request was successful (returned {} for 204).
  // A simple check for an object might suffice, assuming rejection payload is different.
  // A more robust check could involve checking specific properties of rejection payload if known.
  if (typeof result === 'object' && result !== null) {
    // Check if it's our specific empty object, though any non-rejected result is success here.
    return userId; // Return the userId on successful deletion
  }

  // If result is not an object, it implies makeApiRequest returned the rejection payload.
  // createAsyncThunk handles the rejected state automatically.
  // We need to satisfy the return type, so throw an error if somehow we get here.
  throw new Error('Deletion failed unexpectedly after API request.');
});

// Thunk to fetch all available roles (Admin operation)
export const fetchAllRoles = createAsyncThunk<
  RoleDto[], // Return type on success (array of roles)
  void, // No arguments needed
  AsyncThunkConfig
>('user/fetchAllRoles', async (_, thunkAPI) => {
  const result = await makeApiRequest<RoleDto[]>(
    `/api/admin/roles`, // Endpoint for roles
    'GET', // Method
    thunkAPI, // Pass the thunk API object
    { loadingMessage: `Fetching roles...` } // Options
  );

  // Explicitly check the type of the result
  // If it's an array, assume success (this could be more robust by checking array elements)
  if (Array.isArray(result)) {
    return result; // Return the RoleDto[] array on success
  }

  // Otherwise, assume it's the rejected payload from makeApiRequest.
  // We need to return something that createAsyncThunk understands as rejected.
  // Since makeApiRequest already dispatched setAppError and called rejectWithValue,
  // we can throw an error here, or re-reject.
  // Throwing an error will ensure the thunk promise rejects.
  throw new Error(
    'Failed to fetch roles. Check console or Redux state for details.'
  );
  // Alternatively, re-reject (less common):
  // return thunkAPI.rejectWithValue(result as string); // Assuming rejection payload is string
});
