import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../domain/role.js';
import type { AuthenticatedUser } from './authenticated-user.js';
import { ROLES_KEY } from './decorators.js';
import { RolesGuard } from './roles.guard.js';

function createContext(
  user: AuthenticatedUser | undefined,
  requiredRoles: Role[] | undefined,
) {
  class TestController {}
  const handler = () => undefined;
  if (requiredRoles) {
    Reflect.defineMetadata(ROLES_KEY, requiredRoles, handler);
  }
  return {
    getHandler: () => handler,
    getClass: () => TestController,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  const guard = new RolesGuard(new Reflector());
  const mechanic: AuthenticatedUser = { userId: 'u1', role: Role.MECHANIC };

  it('libera rotas sem @Roles', () => {
    expect(guard.canActivate(createContext(mechanic, undefined))).toBe(true);
  });

  it('libera quando a função do usuário está na lista', () => {
    const context = createContext(mechanic, [Role.MECHANIC, Role.MANAGER]);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('bloqueia quando a função do usuário não está na lista', () => {
    const context = createContext(mechanic, [Role.MANAGER]);
    expect(guard.canActivate(context)).toBe(false);
  });

  it('bloqueia rota com @Roles quando não há usuário na requisição', () => {
    const context = createContext(undefined, [Role.MANAGER]);
    expect(guard.canActivate(context)).toBe(false);
  });
});
