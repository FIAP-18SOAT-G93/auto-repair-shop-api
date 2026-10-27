import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { Role } from '../src/modules/auth/domain/role.js';
import { PrismaTransactionHost } from '../src/shared/infrastructure/database/prisma-transaction-host.js';
import { removeHelperUsers, tokenFor } from './helpers/auth.js';

describe('Catálogo de serviços (e2e)', () => {
  let app: INestApplication<App>;
  let attendant: string;
  let mechanic: string;
  let manager: string;
  const createdIds: string[] = [];

  const api = () => request(app.getHttpServer());
  const newService = () => ({
    name: `Serviço E2E ${randomUUID()}`,
    description: 'Criado pelo teste e2e',
    price: 89.9,
    estimatedMinutes: 40,
  });

  async function createService(body = newService()) {
    const response = await api()
      .post('/services')
      .set('Authorization', `Bearer ${manager}`)
      .send(body)
      .expect(201);
    createdIds.push(response.body.id as string);
    return response.body as { id: string; price: number };
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();

    attendant = await tokenFor(app, Role.ATTENDANT);
    mechanic = await tokenFor(app, Role.MECHANIC);
    manager = await tokenFor(app, Role.MANAGER);
  });

  afterAll(async () => {
    await app
      ?.get(PrismaTransactionHost)
      .client.service.deleteMany({ where: { id: { in: createdIds } } });
    if (app) await removeHelperUsers(app);
    await app?.close();
  });

  describe('cadastro', () => {
    it('o gestor cadastra um serviço, com o preço em reais', async () => {
      const created = await createService();

      expect(created).toMatchObject({ price: 89.9, estimatedMinutes: 40 });
    });

    it.each<[string, () => string]>([
      ['atendente', () => attendant],
      ['mecânico', () => mechanic],
    ])('responde 403 para o %s', async (_role, token) => {
      await api()
        .post('/services')
        .set('Authorization', `Bearer ${token()}`)
        .send(newService())
        .expect(403);
    });

    it.each<[Record<string, unknown>, string]>([
      [{ name: '' }, 'nome vazio'],
      [{ name: 'A'.repeat(101) }, 'nome longo demais'],
      [{ price: -1 }, 'preço negativo'],
      [{ price: 10.555 }, 'preço com três casas decimais'],
      [{ price: '89.90' }, 'preço como texto'],
      [{ estimatedMinutes: 0 }, 'tempo zero'],
      [{ estimatedMinutes: 30.5 }, 'tempo fracionado'],
    ])('responde 400 para %o (%s)', async (override) => {
      await api()
        .post('/services')
        .set('Authorization', `Bearer ${manager}`)
        .send({ ...newService(), ...override })
        .expect(400);
    });
  });

  describe('consultas', () => {
    it('o mecânico consulta o catálogo e o detalhe do serviço', async () => {
      const created = await createService();

      const list = await api()
        .get('/services')
        .query({ pageSize: 100 })
        .set('Authorization', `Bearer ${mechanic}`)
        .expect(200);
      const ids = (list.body.items as { id: string }[]).map((s) => s.id);
      expect(ids).toContain(created.id);

      const detail = await api()
        .get(`/services/${created.id}`)
        .set('Authorization', `Bearer ${mechanic}`)
        .expect(200);
      expect(detail.body.price).toBe(89.9);
    });

    it('responde 404 para serviço inexistente', async () => {
      await api()
        .get(`/services/${randomUUID()}`)
        .set('Authorization', `Bearer ${mechanic}`)
        .expect(404);
    });

    it('responde 400 para id que não é UUID', async () => {
      await api()
        .get('/services/nao-e-uuid')
        .set('Authorization', `Bearer ${mechanic}`)
        .expect(400);
    });
  });

  describe('alteração e remoção', () => {
    it('gestor altera o serviço', async () => {
      const created = await createService();

      await api()
        .put(`/services/${created.id}`)
        .set('Authorization', `Bearer ${manager}`)
        .send({
          name: 'Serviço E2E Alterado',
          description: null,
          price: 99.99,
          estimatedMinutes: 60,
        })
        .expect(200);
      const detail = await api()
        .get(`/services/${created.id}`)
        .set('Authorization', `Bearer ${manager}`)
        .expect(200);
      expect(detail.body.name).toBe('Serviço E2E Alterado');
      expect(detail.body.description).toBeNull();
      expect(detail.body.price).toBe(99.99);
      expect(detail.body.estimatedMinutes).toBe(60);
    });

    it('atendente não pode alterar o serviço', async () => {
      const created = await createService();

      await api()
        .put(`/services/${created.id}`)
        .set('Authorization', `Bearer ${attendant}`)
        .send({
          name: 'Serviço E2E Alterado',
          description: null,
          price: 99.99,
          estimatedMinutes: 60,
        })
        .expect(403);
    });

    it('gestor remove o serviço', async () => {
      const created = await createService();

      await api()
        .delete(`/services/${created.id}`)
        .set('Authorization', `Bearer ${manager}`)
        .expect(204);
      await api()
        .get(`/services/${created.id}`)
        .set('Authorization', `Bearer ${manager}`)
        .expect(404);
      await api()
        .delete(`/services/${created.id}`)
        .set('Authorization', `Bearer ${manager}`)
        .expect(404);
    });
  });
});
