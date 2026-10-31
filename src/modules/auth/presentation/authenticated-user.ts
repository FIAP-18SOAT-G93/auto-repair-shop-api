import type { Role } from '../domain/role.js';

export interface AuthenticatedUser {
  id: string;
  role: Role;
}
