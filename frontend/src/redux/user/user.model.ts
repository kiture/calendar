import { RoleDto } from '../../types/RoleDto';
import { UserDto } from '../../types/UserDto';
/**
 * Defines the structure of the user state managed by Redux.
 */
export interface UserState {
  /** The currently logged-in user's data, or null if not logged in. */
  user: UserDto | null;
  /** The JWT access token received upon successful login, or null. */
  accessToken: string | null;
  users: UserDto[];
  roles: RoleDto[];
}

/**
 * The initial state for the user slice.
 */
export const initialState: UserState = {
  user: null,
  accessToken: null,
  users: [],
  roles: [],
};
