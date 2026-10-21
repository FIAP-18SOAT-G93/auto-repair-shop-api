import type { Role } from '../domain/role.js';

export interface AccessTokenPayload {
  sub: string;
  role: Role;
}

export abstract class AccessTokenIssuer {
  abstract issue(payload: AccessTokenPayload): Promise<string>;
}
