import { User } from './db.types';

/**
 * DTO representing a user, excluding sensitive fields like password hash.
 * Used in various API responses.
 */
export type UserDto = Omit<User, 'password_hash'>; 