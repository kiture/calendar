import { createAsyncThunk } from '@reduxjs/toolkit';
import { RootState, AppDispatch } from '../store'; // Import store types
import { makeApiRequest } from '../../utils/fetch-helper';
import { ListGroupsResponseDto } from '../../types/ListGroupsResponseDto';

// Define a type for the thunk API config using RootState and AppDispatch
type AsyncThunkConfig = {
  state: RootState;
  dispatch: AppDispatch;
  getState: () => RootState;
  rejectValue: string;
};

export const fetchUserGroups = createAsyncThunk<
  ListGroupsResponseDto,
  void,
  AsyncThunkConfig
>('group/fetchUserGroups', async (_, thunkAPI) => {
  return makeApiRequest<ListGroupsResponseDto>(
    '/api/groups', // URL path
    'GET', // Method
    thunkAPI, // Pass the thunk API object
    { loadingMessage: 'Loading user groups...' } // Options
  );
});

export const fetchAllGroups = createAsyncThunk<
  ListGroupsResponseDto,
  void,
  AsyncThunkConfig
>('group/fetchAllGroups', async (_, thunkAPI) => {
  return makeApiRequest<ListGroupsResponseDto>(
    '/api/admin/groups', // URL path (admin endpoint)
    'GET', // Method
    thunkAPI, // Pass the thunk API object
    { loadingMessage: 'Loading all groups...' } // Options
  );
});

// Thunk to create a new group
export const createGroup = createAsyncThunk<
  GroupDto, // Return type on success
  { group_name: string }, // Argument type (group name)
  AsyncThunkConfig // Thunk config
>('group/createGroup', async (groupData, thunkAPI) => {
  return makeApiRequest<GroupDto>(
    '/api/admin/groups', // URL path (admin endpoint)
    'POST', // Method
    thunkAPI, // Pass the thunk API object
    {
      data: groupData, // Pass group data in options
      loadingMessage: 'Creating group...',
    } // Options
  );
});

// Thunk to fetch a single group by its ID
export const fetchGroupById = createAsyncThunk<
  GroupDto, // Success return type
  string, // Argument type (groupId)
  AsyncThunkConfig
>('group/fetchGroupById', async (groupId, thunkAPI) => {
  return makeApiRequest<GroupDto>(
    `/api/admin/groups/${groupId}`, // URL path including groupId
    'GET', // Method
    thunkAPI, // Pass the thunk API object
    { loadingMessage: `Loading group ${groupId}...` } // Options
  );
});

// Thunk to update a group
export const updateGroup = createAsyncThunk<
  GroupDto, // Success return type
  { groupId: string; group_name: string }, // Argument type
  AsyncThunkConfig
>('group/updateGroup', async ({ groupId, group_name }, thunkAPI) => {
  return makeApiRequest<GroupDto>(
    `/api/admin/groups/${groupId}`, // URL path including groupId
    'PUT', // Method
    thunkAPI, // Pass the thunk API object
    {
      data: { group_name }, // Pass group_name in data
      loadingMessage: `Updating group ${groupId}...`,
    } // Options
  );
});

// Thunk to delete a group
export const deleteGroup = createAsyncThunk<
  string, // Return groupId on success
  string, // Argument type (groupId)
  AsyncThunkConfig
>('group/deleteGroup', async (groupId, thunkAPI) => {
  // makeApiRequest returns {} on 204, so we handle success specifically
  const result = await makeApiRequest<void>( // Expect void/empty from helper on 204
    `/api/admin/groups/${groupId}`, // URL path including groupId
    'DELETE', // Method
    thunkAPI, // Pass the thunk API object
    { loadingMessage: `Deleting group ${groupId}...` } // Options
  );

  // Check if the result indicates success (i.e., not a rejection payload)
  // createAsyncThunk automatically handles the rejected case from rejectWithValue
  // If makeApiRequest didn't throw/reject, it was successful.
  if (typeof result !== 'function') {
    // Crude check to ensure it's not the rejectWithValue payload
    return groupId; // Return the groupId on success
  }
  // If makeApiRequest somehow returned the rejectWithValue function, re-throw or handle
  // This path shouldn't typically be hit if makeApiRequest works as expected.
  throw new Error('Deletion failed unexpectedly after API request.');
});

// Thunk to add a member to a group
export const addGroupMember = createAsyncThunk<
  GroupMembershipDto, // Success return type (the new membership record)
  { groupId: string; userId: string }, // Argument type
  AsyncThunkConfig
>('group/addMember', async ({ groupId, userId }, thunkAPI) => {
  return makeApiRequest<GroupMembershipDto>(
    `/api/admin/groups/${groupId}/members`, // Dynamic URL path
    'POST', // Method
    thunkAPI, // Pass the thunk API object
    {
      data: { user_id: userId }, // Pass user_id in data body
      loadingMessage: `Adding member to group ${groupId}...`,
    } // Options
  );
});

// Thunk to remove a member from a group
export const removeGroupMember = createAsyncThunk<
  { groupId: string; userId: string }, // Return IDs on success
  { groupId: string; userId: string }, // Argument type
  AsyncThunkConfig
>('group/removeMember', async ({ groupId, userId }, thunkAPI) => {
  // makeApiRequest returns {} on 204, so we handle success specifically
  const result = await makeApiRequest<void>( // Expect void/empty from helper on 204
    `/api/admin/groups/${groupId}/members/${userId}`, // Dynamic URL path
    'DELETE', // Method
    thunkAPI, // Pass the thunk API object
    { loadingMessage: `Removing member ${userId} from group ${groupId}...` } // Options
  );

  // Check if the result indicates success (i.e., not a rejection payload)
  if (typeof result !== 'function') {
    // Crude check to ensure it's not the rejectWithValue payload
    return { groupId, userId }; // Return the IDs on success
  }
  // This path shouldn't typically be hit.
  throw new Error('Member removal failed unexpectedly after API request.');
});

// Thunk to list members for a specific group
export const fetchGroupMembers = createAsyncThunk<
  ListGroupMembersResponseDto, // Success return type
  string, // Argument type (groupId)
  AsyncThunkConfig
>('group/fetchMembers', async (groupId, thunkAPI) => {
  return makeApiRequest<ListGroupMembersResponseDto>(
    `/api/admin/groups/${groupId}/members`, // Dynamic URL path
    'GET', // Method
    thunkAPI, // Pass the thunk API object
    { loadingMessage: `Loading members for group ${groupId}...` } // Options
  );
});
