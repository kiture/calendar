import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { GroupState } from './group.model';
import { fetchUserGroups, fetchAllGroups, createGroup } from './group.thunks';

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
        state.userGroups = action.payload.groups;
        state.selectedGroupId = action.payload.groups[0]?.id;
      })
      .addCase(fetchAllGroups.fulfilled, (state, action) => {
        state.groups = action.payload.groups;
      })
      .addCase(createGroup.fulfilled, (state, action) => {
        state.groups.push(action.payload);
      });
  },
});

export const { setSelectedGroupId } = groupSlice.actions;
export default groupSlice.reducer;
