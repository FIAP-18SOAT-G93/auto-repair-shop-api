import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { Role } from '../src/modules/auth/domain/role.js';
import { PrismaTransactionHost } from '../src/shared/infrastructure/database/prisma-transaction-host.js';
import { removeHelperUsers, tokenFor } from './helpers/auth.js';

interface PartBody {
  id: string;
  name: string;
  type: string;
  price: number;
  quantity: number;
}

describe('Estoque de peças e insumos (e2e)', () => {
  let app: INestApplication<App>;
  let attendant: string;
  let mechanic: string;
  let manager: string;
  const createdIds: string[] = [];

  const api = () => request(app.getHttpServer());
  const newPart = (quantity = 10) => ({
    name: `Peça E2E ${randomUUID()}`,
    type: 'PART',
    price: 149.9,
    quantity,
  });

  async function createPart(body = newPart()): Promise<PartBody> {
    const response = await api()
      .post('/parts')
      .set('Authorization', `Bearer ${manager}`)
      .send(body)
      .expect(201);
    createdIds.push(response.body.id as string);
    return response.body as PartBody;
  }

  async function unavailableIds(): Promise<string[]> {
    const response = await api()
      .get('/parts/unavailable')
      .query({ pageSize: 100 })
      .set('Authorization', `Bearer ${manager}`)
      .expect(200);
    return (response.body.items as PartBody[]).map((p) => p.id);
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
      .client.part.deleteMany({ where: { id: { in: createdIds } } });
    if (app) await removeHelperUsers(app);
    await app?.close();
  });

  describe('cadastro', () => {
    it('o gestor cadastra uma peça com o saldo inicial', async () => {
      const created = await createPart();

      expect(created).toMatchObject({
        type: 'PART',
        price: 149.9,
        quantity: 10,
      });
    });

    it('responde 403 para o mecânico', async () => {
      await api()
        .post('/parts')
        .set('Authorization', `Bearer ${mechanic}`)
        .send(newPart())
        .expect(403);
    });

    it.each<[Record<string, unknown>, string]>([
      [{ name: '' }, 'nome vazio'],
      [{ type: 'TOOL' }, 'tipo desconhecido'],
      [{ price: 10.555 }, 'preço com três casas decimais'],
      [{ quantity: -1 }, 'quantidade negativa'],
      [{ quantity: 1.5 }, 'quantidade fracionada'],
    ])('responde 400 para %o (%s)', async (override) => {
      await api()
        .post('/parts')
        .set('Authorization', `Bearer ${manager}`)
        .send({ ...newPart(), ...override })
        .expect(400);
    });
  });

  describe('consultas', () => {
    it('o mecânico consulta o estoque e o detalhe da peça', async () => {
      const created = await createPart();

      const list = await api()
        .get('/parts')
        .query({ pageSize: 100 })
        .set('Authorization', `Bearer ${mechanic}`)
        .expect(200);
      expect((list.body.items as PartBody[]).map((p) => p.id)).toContain(
        created.id,
      );

      const detail = await api()
        .get(`/parts/${created.id}`)
        .set('Authorization', `Bearer ${mechanic}`)
        .expect(200);
      expect(detail.body.quantity).toBe(10);
    });

    it('lista só as peças sem saldo para o gestor', async () => {
      const outOfStock = await createPart(newPart(0));
      const inStock = await createPart(newPart(5));

      const ids = await unavailableIds();

      expect(ids).toContain(outOfStock.id);
      expect(ids).not.toContain(inStock.id);
    });

    it('responde 403 para o mecânico na lista de indisponíveis', async () => {
      await api()
        .get('/parts/unavailable')
        .set('Authorization', `Bearer ${mechanic}`)
        .expect(403);
    });

    it('responde 404 para peça inexistente', async () => {
      await api()
        .get(`/parts/${randomUUID()}`)
        .set('Authorization', `Bearer ${mechanic}`)
        .expect(404);
    });
  });

  describe('alteração', () => {
    it('o gestor altera nome, tipo e preço, sem mexer no saldo', async () => {
      const created = await createPart();

      const response = await api()
        .put(`/parts/${created.id}`)
        .set('Authorization', `Bearer ${manager}`)
        .send({ name: 'Óleo de motor E2E', type: 'SUPPLY', price: 45 })
        .expect(200);

      expect(response.body).toMatchObject({
        name: 'Óleo de motor E2E',
        type: 'SUPPLY',
        price: 45,
        quantity: 10,
      });
    });

    it('recusa alterar o saldo pelo PUT', async () => {
      const created = await createPart();

      await api()
        .put(`/parts/${created.id}`)
        .set('Authorization', `Bearer ${manager}`)
        .send({ name: 'Peça E2E', type: 'PART', price: 10, quantity: 999 })
        .expect(400);
      const detail = await api()
        .get(`/parts/${created.id}`)
        .set('Authorization', `Bearer ${manager}`)
        .expect(200);
      expect(detail.body.quantity).toBe(10);
    });
  });

  describe('entrada de estoque', () => {
    it('o gestor repõe uma peça, que sai da lista de indisponíveis', async () => {
      const created = await createPart(newPart(0));

      const response = await api()
        .post(`/parts/${created.id}/stock-entry`)
        .set('Authorization', `Bearer ${manager}`)
        .send({ quantity: 5 })
        .expect(200);

      expect(response.body.quantity).toBe(5);
      expect(await unavailableIds()).not.toContain(created.id);
    });

    it('responde 400 para entrada de quantidade zero', async () => {
      const created = await createPart();

      await api()
        .post(`/parts/${created.id}/stock-entry`)
        .set('Authorization', `Bearer ${manager}`)
        .send({ quantity: 0 })
        .expect(400);
    });

    it('responde 403 para o atendente', async () => {
      const created = await createPart();

      await api()
        .post(`/parts/${created.id}/stock-entry`)
        .set('Authorization', `Bearer ${attendant}`)
        .send({ quantity: 5 })
        .expect(403);
    });

    it('responde 404 para peça inexistente', async () => {
      await api()
        .post(`/parts/${randomUUID()}/stock-entry`)
        .set('Authorization', `Bearer ${manager}`)
        .send({ quantity: 5 })
        .expect(404);
    });
  });

  describe('remoção', () => {
    it('o gestor remove a peça, remover de novo responde 404', async () => {
      const created = await createPart();

      await api()
        .delete(`/parts/${created.id}`)
        .set('Authorization', `Bearer ${manager}`)
        .expect(204);
      await api()
        .get(`/parts/${created.id}`)
        .set('Authorization', `Bearer ${manager}`)
        .expect(404);
      await api()
        .delete(`/parts/${created.id}`)
        .set('Authorization', `Bearer ${manager}`)
        .expect(404);
    });
  });
});
