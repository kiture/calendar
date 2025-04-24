import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { GroupState } from './group.model';
import {
  fetchUserGroups,
  fetchAllGroups,
  createGroup,
  updateGroup,
} from './group.thunks';

const initialState: GroupState = {
  groups: [],
  userGroups: [],
  selectedGroupId: null,
};

const groupSlice = createSlice({
  name: 'group',
  initialState,
  reducers: {
    setSelectedGroupId(state, action: PayloadAction<string | null>) {
      state.selectedGroupId = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserGroups.fulfilled, (state, action) => {
        state.userGroups = action.payload;
        state.selectedGroupId = action.payload[0]?.group_id;
      })
      .addCase(fetchAllGroups.fulfilled, (state, action) => {
        state.groups = action.payload;
      })
      .addCase(createGroup.fulfilled, (state, action) => {
        state.groups.push(action.payload);
        state.userGroups.push(action.payload);
      })
      .addCase(updateGroup.fulfilled, (state, action) => {
        state.groups = state.groups.map((group) =>
          group.group_id === action.payload.group_id ? action.payload : group
        );
        state.userGroups = state.userGroups.map((group) =>
          group.group_id === action.payload.group_id ? action.payload : group
        );
      });
  },
});

export const { setSelectedGroupId } = groupSlice.actions;
export default groupSlice.reducer;
