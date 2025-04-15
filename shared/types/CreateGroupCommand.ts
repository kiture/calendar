import { Group } from './db.types';

/**
 * Command model for creating a new group (Admin only).
 */
export type CreateGroupCommand = Pick<Group, 'group_name'>; 