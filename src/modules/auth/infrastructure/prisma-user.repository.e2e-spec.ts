import { randomUUID } from 'node:crypto';
import { ConfigModule } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { validateEnv } from '../../../shared/infrastructure/config/env.validation.js';
import { PrismaModule } from '../../../shared/infrastructure/database/prisma.module.js';
import { PrismaTransactionHost } from '../../../shared/infrastructure/database/prisma-transaction-host.js';
import { EmailAlreadyInUseError } from '../domain/auth.errors.js';
import { Role } from '../domain/role.js';
import { User } from '../domain/user.js';
import { PrismaUserRepository } from './prisma-user.repository.js';

const TEST_DOMAIN = '@e2e-test.com';

function newUser(email = `${randomUUID()}${TEST_DOMAIN}`): User {
  return User.create({
    name: 'Usuário de Teste',
    email,
    passwordHash: '$2b$10$hash-de-teste',
    role: Role.MECHANIC,
  });
}

describe('PrismaUserRepository (integração)', () => {
  let moduleRef: TestingModule;
  let repository: PrismaUserRepository;
  let host: PrismaTransactionHost;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
        PrismaModule,
      ],

      providers: [PrismaUserRepository],
    }).compile();
    await moduleRef.init();

    repository = moduleRef.get(PrismaUserRepository);
    host = moduleRef.get(PrismaTransactionHost);
  });

  afterAll(async () => {
    await host.client.user.deleteMany({
      where: { email: { endsWith: TEST_DOMAIN } },
    });
    await moduleRef.close();
  });

  it('grava e lê o usuário de volta, por e-mail e por id', async () => {
    const user = newUser();

    await repository.save(user);

    const byEmail = await repository.findByEmail(user.email);
    const byId = await repository.findById(user.id);
    expect(byEmail?.id).toBe(user.id);
    expect(byId?.email).toBe(user.email);
    expect(byId?.passwordHash).toBe('$2b$10$hash-de-teste');
    expect(byId?.role).toBe(Role.MECHANIC);
  });

  it('devolve null para e-mail e id inexistentes', async () => {
    expect(await repository.findByEmail(`ninguem${TEST_DOMAIN}`)).toBeNull();
    expect(await repository.findById(randomUUID())).toBeNull();
  });

  it('converte e-mail duplicado em EmailAlreadyInUseError', async () => {
    const email = `${randomUUID()}${TEST_DOMAIN}`;
    await repository.save(newUser(email));

    await expect(repository.save(newUser(email))).rejects.toThrow(
      EmailAlreadyInUseError,
    );
  });
});
