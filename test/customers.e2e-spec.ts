import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { Role } from '../src/modules/auth/domain/role.js';
import { generateCpf } from '../src/modules/customer/testing/document-generator.js';
import { PrismaTransactionHost } from '../src/shared/infrastructure/database/prisma-transaction-host.js';
import { removeHelperUsers, tokenFor } from './helpers/auth.js';

describe('Clientes (e2e)', () => {
  let app: INestApplication<App>;
  let attendant: string;
  let mechanic: string;
  let manager: string;
  const createdIds: string[] = [];

  const api = () => request(app.getHttpServer());
  const newCustomer = () => ({
    name: 'Cliente E2E',
    document: generateCpf(),
    email: 'cliente@e2e.test',
    phone: '(11) 98765-4321',
  });

  async function createCustomer(body = newCustomer()) {
    const response = await api()
      .post('/customers')
      .set('Authorization', `Bearer ${attendant}`)
      .send(body)
      .expect(201);
    createdIds.push(response.body.id as string);
    return response.body as { id: string; document: string };
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
      .client.customer.deleteMany({ where: { id: { in: createdIds } } });
    if (app) await removeHelperUsers(app);
    await app?.close();
  });

  describe('cadastro', () => {
    it('responde 401 sem token', async () => {
      await api().post('/customers').send(newCustomer()).expect(401);
    });

    it('cadastra pelo atendente e devolve o documento formatado', async () => {
      const body = newCustomer();
      const created = await createCustomer(body);

      expect(created.document).toMatch(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/);
    });

    it('responde 403 para o mecânico', async () => {
      await api()
        .post('/customers')
        .set('Authorization', `Bearer ${mechanic}`)
        .send(newCustomer())
        .expect(403);
    });

    it('responde 400 para documento com dígito verificador errado', async () => {
      await api()
        .post('/customers')
        .set('Authorization', `Bearer ${attendant}`)
        .send({ ...newCustomer(), document: '529.982.247-26' })
        .expect(400);
    });

    it('responde 409 para documento já cadastrado', async () => {
      const body = newCustomer();
      await createCustomer(body);

      await api()
        .post('/customers')
        .set('Authorization', `Bearer ${attendant}`)
        .send(body)
        .expect(409);
    });
  });

  describe('consultas', () => {
    it('busca pelo documento formatado, inclusive pelo mecânico', async () => {
      const created = await createCustomer();

      const response = await api()
        .get('/customers/search')
        .query({ document: created.document })
        .set('Authorization', `Bearer ${mechanic}`)
        .expect(200);
      expect(response.body.id).toBe(created.id);
    });

    it('responde 400 para id que não é UUID', async () => {
      await api()
        .get('/customers/nao-e-uuid')
        .set('Authorization', `Bearer ${mechanic}`)
        .expect(400);
    });

    it('responde 404 para cliente inexistente', async () => {
      await api()
        .get(`/customers/${randomUUID()}`)
        .set('Authorization', `Bearer ${mechanic}`)
        .expect(404);
    });

    it('lista com os valores padrão de paginação', async () => {
      await createCustomer();

      const response = await api()
        .get('/customers')
        .set('Authorization', `Bearer ${mechanic}`)
        .expect(200);
      expect(response.body).toMatchObject({ page: 1, pageSize: 20 });
      expect(response.body.items.length).toBeGreaterThan(0);
    });

    it.each(['page=0', 'pageSize=0', 'pageSize=101', 'page=abc'])(
      'responde 400 para paginação inválida (%s)',
      async (queryString) => {
        await api()
          .get(`/customers?${queryString}`)
          .set('Authorization', `Bearer ${mechanic}`)
          .expect(400);
      },
    );
  });

  describe('alteração', () => {
    it('altera nome, email e telefone', async () => {
      const created = await createCustomer();

      const response = await api()
        .put(`/customers/${created.id}`)
        .set('Authorization', `Bearer ${attendant}`)
        .send({ name: 'Nome Alterado', email: null, phone: null })
        .expect(200);
      expect(response.body.name).toBe('Nome Alterado');
      expect(response.body.email).toBeNull();
      expect(response.body.phone).toBeNull();
    });

    it('responde 400 ao tentar alterar o documento', async () => {
      const created = await createCustomer();

      await api()
        .put(`/customers/${created.id}`)
        .set('Authorization', `Bearer ${attendant}`)
        .send({ name: 'Qualquer', document: generateCpf() })
        .expect(400);
    });
  });

  describe('remoção', () => {
    it('responde 403 para o atendente', async () => {
      const created = await createCustomer();

      await api()
        .delete(`/customers/${created.id}`)
        .set('Authorization', `Bearer ${attendant}`)
        .expect(403);
    });

    it('responde 403 para o mecânico', async () => {
      const created = await createCustomer();

      await api()
        .delete(`/customers/${created.id}`)
        .set('Authorization', `Bearer ${mechanic}`)
        .expect(403);
    });

    it('remove pelo gestor e o cliente deixa de existir', async () => {
      const created = await createCustomer();

      await api()
        .delete(`/customers/${created.id}`)
        .set('Authorization', `Bearer ${manager}`)
        .expect(204);
      await api()
        .get(`/customers/${created.id}`)
        .set('Authorization', `Bearer ${manager}`)
        .expect(404);
    });

    it('permite recadastrar o documento de um cliente removido', async () => {
      const body = newCustomer();
      const removed = await createCustomer(body);
      await api()
        .delete(`/customers/${removed.id}`)
        .set('Authorization', `Bearer ${manager}`)
        .expect(204);

      const recreated = await createCustomer(body);

      expect(recreated.id).not.toBe(removed.id);
    });
  });
});
