import { GroupDto } from '../../types/GroupDto';

export interface GroupState {
  groups: GroupDto[];
  userGroups: GroupDto[];
  selectedGroupId: string | null;
}
