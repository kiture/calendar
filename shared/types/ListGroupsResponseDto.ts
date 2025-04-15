import { GroupDto } from './GroupDto';

/**
 * DTO for the response when listing groups.
 */
export interface ListGroupsResponseDto {
  groups: GroupDto[];
  total_count: number;
} 