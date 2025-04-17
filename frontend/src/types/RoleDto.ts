import { Role } from './db.types';

/**
 * Data Transfer Object (DTO) for Role information.
 */
export interface RoleDto extends Role {
  role_id: string;
  role_name: string;
}
