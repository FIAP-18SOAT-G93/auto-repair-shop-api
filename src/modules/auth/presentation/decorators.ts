import {
  createParamDecorator,
  type ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import type { Role } from '../domain/role.js';
import type { AuthenticatedUser } from './authenticated-user.js';

export const IS_PUBLIC_KEY = 'isPublic';
export const ROLES_KEY = 'roles';

/** Libera a rota sem token. Por padrão, toda rota exige autenticação. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/** Restringe a rota para as funções informadas. */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

/** Injeta no parâmetro do controller o usuário autenticado da requisição. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser =>
    context.switchToHttp().getRequest<{ user: AuthenticatedUser }>().user,
);
