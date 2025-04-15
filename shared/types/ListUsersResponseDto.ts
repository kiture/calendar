import { UserDto } from './UserDto';

/**
 * DTO for the response when listing users (Admin only).
 */
export interface ListUsersResponseDto {
  users: UserDto[];
  total_count: number;
} 