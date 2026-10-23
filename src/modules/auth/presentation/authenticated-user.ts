import type { Role } from '../domain/role.js';

export interface AuthenticatedUser {
  userId: string;
  role: Role;
}
