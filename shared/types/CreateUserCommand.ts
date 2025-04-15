import { User } from './db.types';

/**
 * Command model for creating a new user (Admin only).
 */
export interface CreateUserCommand extends Pick<User, 'email' | 'login' | 'first_name' | 'last_name' | 'role_id'> {
  /** Initial plain text password for the new user. */
  password: string;
} 