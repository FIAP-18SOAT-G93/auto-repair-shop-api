import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { PasswordHasher } from '../../src/modules/auth/application/password-hasher.js';
import type { Role } from '../../src/modules/auth/domain/role.js';
import { User } from '../../src/modules/auth/domain/user.js';
import { UserRepository } from '../../src/modules/auth/domain/user.repository.js';
import { PrismaTransactionHost } from '../../src/shared/infrastructure/database/prisma-transaction-host.js';

const HELPER_DOMAIN = '@e2e-helper.test';
const PASSWORD = 'Senha@Teste123';

/** Cria um usuário com a função informada e devolve um token válido para ele. */
export async function tokenFor(
  app: INestApplication<App>,
  role: Role,
): Promise<string> {
  const email = `${randomUUID()}${HELPER_DOMAIN}`;
  const user = User.create({
    name: `Teste ${role}`,
    email,
    passwordHash: await app.get(PasswordHasher).hash(PASSWORD),
    role,
  });
  await app.get(UserRepository).save(user);

  const response = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email, password: PASSWORD })
    .expect(200);
  return response.body.accessToken as string;
}

/** Apaga os usuários criados pelo tokenFor. */
export async function removeHelperUsers(
  app: INestApplication<App>,
): Promise<void> {
  await app
    .get(PrismaTransactionHost)
    .client.user.deleteMany({ where: { email: { endsWith: HELPER_DOMAIN } } });
}
