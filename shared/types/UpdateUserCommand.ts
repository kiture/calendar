import { User } from './db.types';

/**
 * Command model for updating user details (Admin only).
 * All fields are optional.
 */
export type UpdateUserCommand = Partial<Pick<User, 'email' | 'login' | 'first_name' | 'last_name' | 'role_id'>>; 