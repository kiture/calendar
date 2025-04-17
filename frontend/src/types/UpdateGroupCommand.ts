import { Group } from './db.types';

/**
 * Command model for updating group details (Admin only).
 */
export type UpdateGroupCommand = Pick<Group, 'group_name'>;
