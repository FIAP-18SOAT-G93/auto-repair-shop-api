import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { PasswordHasher } from '../src/modules/auth/application/password-hasher.js';
import { Role, TeamRole } from '../src/modules/auth/domain/role.js';
import { User } from '../src/modules/auth/domain/user.js';
import { UserRepository } from '../src/modules/auth/domain/user.repository.js';
import { PrismaTransactionHost } from '../src/shared/infrastructure/database/prisma-transaction-host.js';

const TEST_DOMAIN = '@e2e-auth.test';
const PASSWORD = 'Senha@Teste123';

describe('Autenticação (e2e)', () => {
  let app: INestApplication<App>;
  let managerEmail: string;
  let mechanicEmail: string;

  async function createUser(role: TeamRole): Promise<string> {
    const email = `${randomUUID()}${TEST_DOMAIN}`;
    const hasher = app.get(PasswordHasher);
    const user = User.create({
      name: `Teste ${role}`,
      email,
      passwordHash: await hasher.hash(PASSWORD),
      role,
    });
    await app.get(UserRepository).save(user);
    return email;
  }

  async function login(email: string): Promise<string> {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: PASSWORD })
      .expect(200);
    return response.body.accessToken as string;
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();

    managerEmail = await createUser(Role.MANAGER);
    mechanicEmail = await createUser(Role.MECHANIC);
  });

  afterAll(async () => {
    await app
      ?.get(PrismaTransactionHost)
      .client.user.deleteMany({ where: { email: { endsWith: TEST_DOMAIN } } });
    await app?.close();
  });

  describe('POST /auth/login', () => {
    it('devolve o token para credenciais válidas', async () => {
      const token = await login(managerEmail);
      expect(token.split('.')).toHaveLength(3);
    });

    it('responde 401 para senha errada', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: managerEmail, password: 'errada' })
        .expect(401);
      expect(response.body.message).toBe('E-mail ou senha inválidos');
    });

    it('responde 400 para campo não previsto no corpo', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: managerEmail, password: PASSWORD, role: 'MANAGER' })
        .expect(400);
    });
  });

  describe('GET /auth/me', () => {
    it('responde 401 sem token', async () => {
      await request(app.getHttpServer()).get('/auth/me').expect(401);
    });

    it('devolve o usuário logado, sem o hash da senha', async () => {
      const token = await login(mechanicEmail);

      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.email).toBe(mechanicEmail);
      expect(response.body.role).toBe(Role.MECHANIC);
      expect(response.body).not.toHaveProperty('passwordHash');
    });
  });

  describe('POST /users', () => {
    const newUser = () => ({
      name: 'Novo Mecânico',
      email: `${randomUUID()}${TEST_DOMAIN}`,
      password: 'SenhaForte@2026',
      role: Role.MECHANIC,
    });

    it('responde 403 quando quem pede não é gestor', async () => {
      const token = await login(mechanicEmail);

      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${token}`)
        .send(newUser())
        .expect(403);
    });

    it('cadastra o usuário quando quem pede é gestor, e recusa o e-mail repetido', async () => {
      const token = await login(managerEmail);
      const body = newUser();

      const created = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${token}`)
        .send(body)
        .expect(201);
      expect(created.body.id).toEqual(expect.any(String));

      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${token}`)
        .send(body)
        .expect(409);
    });
  });
});
