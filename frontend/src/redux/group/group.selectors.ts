import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';
import { GroupState } from './group.model';

// Select the group slice from the root state
const selectGroupSlice = (state: RootState): GroupState => state.group;

// Selectors for group list
export const selectAllGroups = createSelector(
  [selectGroupSlice],
  (groupState) => groupState.groups
);

// Selectors for selected group ID
export const selectSelectedGroupId = createSelector(
  [selectGroupSlice],
  (groupState) => groupState.selectedGroupId
);

// Selectors for user groups
export const selectUserGroups = createSelector(
  [selectGroupSlice],
  (groupState) => groupState.userGroups
);

export const selectSelectedGroup = createSelector(
  [selectGroupSlice],
  (groupState) =>
    groupState.userGroups.find(
      (group) => group.group_id === groupState.selectedGroupId
    )
);

export const selectSelectedGroupName = createSelector(
  [selectSelectedGroup],
  (group) => group?.group_name
);
