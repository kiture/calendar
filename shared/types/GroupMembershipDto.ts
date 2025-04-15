import { GroupMembership } from './db.types';

/**
 * DTO representing a group membership record.
 * Dates are represented as strings in ISO 8601 format.
 */
export interface GroupMembershipDto extends Omit<GroupMembership, 'joined_at'> {
  joined_at: string; // ISO 8601 format
} 