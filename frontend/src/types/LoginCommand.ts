import { User } from './db.types';

/**
 * Command model for user login request.
 */
export interface LoginCommand extends Pick<User, 'email'> {
  /** Plain text password */
  password: string;
}
