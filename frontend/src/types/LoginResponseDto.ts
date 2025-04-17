import { User } from './db.types';

/**
 * DTO for the response after successful login.
 */
export interface LoginResponseDto {
  accessToken: string;
  /** User details excluding sensitive information like password hash. */
  user: Omit<User, 'password_hash'>;
}
