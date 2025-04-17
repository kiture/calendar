import { GroupMemberDetailsDto } from './GroupMemberDetailsDto';

/**
 * DTO for the response when listing members of a group (Admin only).
 */
export interface ListGroupMembersResponseDto {
  members: GroupMemberDetailsDto[];
  total_count: number;
}
