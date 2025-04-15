import { User } from './db.types';

/**
 * DTO representing detailed information about a group member.
 * Combines user details with membership join date.
 * Dates are represented as strings in ISO 8601 format.
 */
export interface GroupMemberDetailsDto extends Pick<User, 'user_id' | 'email' | 'login' | 'first_name' | 'last_name'> {
  /** The date the user joined the group (ISO 8601 format). */
  joined_at: string; // From GroupMembership, represented as string
} 