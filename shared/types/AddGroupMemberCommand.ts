import { User } from './db.types';

/**
 * Command model for adding a user to a group (Admin only).
 */
export type AddGroupMemberCommand = Pick<User, 'user_id'>; 