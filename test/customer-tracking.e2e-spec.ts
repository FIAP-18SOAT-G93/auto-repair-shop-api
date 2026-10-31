import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { Role } from '../src/modules/auth/domain/role.js';
import { generateCpf } from '../src/modules/customer/testing/document-generator.js';
import { generatePlate } from '../src/modules/customer/testing/plate-generator.js';
import { PrismaTransactionHost } from '../src/shared/infrastructure/database/prisma-transaction-host.js';
import { removeHelperUsers, tokenFor } from './helpers/auth.js';

interface OrderBody {
  id: string;
  customerId: string;
  vehicleId: string;
  trackingCode: string;
  status: string;
}

describe('Acompanhamento do cliente (e2e)', () => {
  let app: INestApplication<App>;
  let attendant: string;
  let mechanic: string;
  let manager: string;
  let serviceId: string;
  let partId: string;
  const orderIds: string[] = [];
  const customerIds = new Set<string>();
  const vehicleIds = new Set<string>();

  const maria = generateCpf();
  const joao = generateCpf();
  let mariaToApprove: OrderBody;
  let mariaToReject: OrderBody;
  let joaoOrder: OrderBody;
  let mariaToken: string;

  const api = () => request(app.getHttpServer());
  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

  async function orderAwaitingApproval(document: string): Promise<OrderBody> {
    const opened = await api()
      .post('/service-orders')
      .set(auth(attendant))
      .send({
        customer: { document, name: 'Cliente Acompanhamento E2E' },
        vehicle: {
          plate: generatePlate(),
          brand: 'Fiat',
          model: 'Uno',
          year: 2015,
        },
      })
      .expect(201);
    const order = opened.body as OrderBody;
    orderIds.push(order.id);
    customerIds.add(order.customerId);
    vehicleIds.add(order.vehicleId);

    const path = `/service-orders/${order.id}`;
    await api().post(`${path}/start-diagnosis`).set(auth(mechanic)).expect(200);
    await api()
      .post(`${path}/services`)
      .set(auth(mechanic))
      .send({ serviceId })
      .expect(200);
    await api()
      .post(`${path}/parts`)
      .set(auth(mechanic))
      .send({ partId, quantity: 1 })
      .expect(200);
    await api()
      .post(`${path}/conclude-diagnosis`)
      .set(auth(mechanic))
      .expect(200);
    return order;
  }

  const login = (document: string, trackingCode: string) =>
    api().post('/auth/customer').send({ document, trackingCode });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();

    attendant = await tokenFor(app, Role.ATTENDANT);
    mechanic = await tokenFor(app, Role.MECHANIC);
    manager = await tokenFor(app, Role.MANAGER);

    const service = await api()
      .post('/services')
      .set(auth(manager))
      .send({
        name: `Serviço Acompanhamento E2E ${randomUUID()}`,
        price: 89.9,
        estimatedMinutes: 40,
      })
      .expect(201);
    serviceId = service.body.id as string;
    const part = await api()
      .post('/parts')
      .set(auth(manager))
      .send({
        name: `Peça Acompanhamento E2E ${randomUUID()}`,
        type: 'PART',
        price: 149.9,
        quantity: 10,
      })
      .expect(201);
    partId = part.body.id as string;

    mariaToApprove = await orderAwaitingApproval(maria);
    mariaToReject = await orderAwaitingApproval(maria);
    joaoOrder = await orderAwaitingApproval(joao);

    const response = await login(maria, mariaToApprove.trackingCode).expect(
      200,
    );
    mariaToken = response.body.accessToken as string;
  });

  afterAll(async () => {
    const client = app?.get(PrismaTransactionHost).client;
    await client?.serviceOrder.deleteMany({ where: { id: { in: orderIds } } });
    await client?.vehicle.deleteMany({
      where: { id: { in: [...vehicleIds] } },
    });
    await client?.customer.deleteMany({
      where: { id: { in: [...customerIds] } },
    });
    await client?.service.deleteMany({ where: { id: serviceId } });
    await client?.part.deleteMany({ where: { id: partId } });
    if (app) await removeHelperUsers(app);
    await app?.close();
  });

  describe('autenticação', () => {
    it('aceita o código em minúsculas e sem hífen', async () => {
      const code = mariaToApprove.trackingCode.replace('-', '').toLowerCase();

      await login(maria, code).expect(200);
    });

    it.each<[string, () => [string, string]]>([
      ['o código de outro cliente', () => [maria, joaoOrder.trackingCode]],
      [
        'o documento de outro cliente',
        () => [joao, mariaToApprove.trackingCode],
      ],
      ['um código que não existe', () => [maria, 'AAAA-AAAA']],
    ])('responde 401 para %s, sem dizer o que errou', async (_case, args) => {
      const response = await login(...args()).expect(401);

      expect(response.body.message).toBe(
        'Documento ou código de acompanhamento inválidos',
      );
    });

    it('responde 400 para um código fora do formato', async () => {
      await login(maria, 'K7QM-4XPU').expect(400);
    });
  });

  describe('as próprias OS', () => {
    it('lista só as OS do cliente autenticado', async () => {
      const response = await api()
        .get('/customer/service-orders')
        .set(auth(mariaToken))
        .expect(200);

      const ids = (response.body.items as OrderBody[]).map((o) => o.id);
      expect(ids.sort()).toEqual([mariaToApprove.id, mariaToReject.id].sort());
    });

    it('acompanha a própria OS, com o código de acompanhamento', async () => {
      const response = await api()
        .get(`/customer/service-orders/${mariaToApprove.id}`)
        .set(auth(mariaToken))
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'AWAITING_APPROVAL',
        trackingCode: mariaToApprove.trackingCode,
      });
    });

    it('aprova o próprio orçamento', async () => {
      const response = await api()
        .post(`/customer/service-orders/${mariaToApprove.id}/approve-quote`)
        .set(auth(mariaToken))
        .send({ version: 1 })
        .expect(200);

      expect((response.body as OrderBody).status).toBe('IN_EXECUTION');
    });

    it('rejeita o próprio orçamento, com motivo', async () => {
      const response = await api()
        .post(`/customer/service-orders/${mariaToReject.id}/reject-quote`)
        .set(auth(mariaToken))
        .send({ version: 1, reason: 'Vou fazer em outra oficina' })
        .expect(200);

      expect((response.body as OrderBody).status).toBe('FINISHED');
    });

    it('não aceita o filtro de cliente, que vem do token', async () => {
      await api()
        .get('/customer/service-orders')
        .query({ customerId: joaoOrder.customerId })
        .set(auth(mariaToken))
        .expect(400);
    });
  });

  describe('a OS de outro cliente', () => {
    it.each<[string, () => request.Test]>([
      [
        'consultar',
        () =>
          api()
            .get(`/customer/service-orders/${joaoOrder.id}`)
            .set(auth(mariaToken)),
      ],
      [
        'aprovar',
        () =>
          api()
            .post(`/customer/service-orders/${joaoOrder.id}/approve-quote`)
            .set(auth(mariaToken))
            .send({ version: 1 }),
      ],
      [
        'rejeitar',
        () =>
          api()
            .post(`/customer/service-orders/${joaoOrder.id}/reject-quote`)
            .set(auth(mariaToken))
            .send({ version: 1 }),
      ],
    ])('responde 404 ao tentar %s', async (_case, call) => {
      await call().expect(404);
    });

    it('continua aguardando aprovação depois das tentativas', async () => {
      const response = await api()
        .get(`/service-orders/${joaoOrder.id}`)
        .set(auth(attendant))
        .expect(200);

      expect((response.body as OrderBody).status).toBe('AWAITING_APPROVAL');
    });
  });

  describe('separação entre cliente e equipe', () => {
    it.each([
      ['GET', '/service-orders'],
      ['GET', '/customers'],
      ['GET', '/parts'],
      ['GET', '/auth/me'],
    ])('o token de cliente recebe 403 em %s %s', async (_method, path) => {
      await api().get(path).set(auth(mariaToken)).expect(403);
    });

    it('o token de cliente não usa a rota de aprovação da equipe', async () => {
      await api()
        .post(`/service-orders/${joaoOrder.id}/approve-quote`)
        .set(auth(mariaToken))
        .send({ version: 1 })
        .expect(403);
    });

    it('a equipe não usa as rotas do cliente', async () => {
      await api()
        .get('/customer/service-orders')
        .set(auth(attendant))
        .expect(403);
    });

    it('não é possível criar um usuário com a função de cliente', async () => {
      await api()
        .post('/users')
        .set(auth(manager))
        .send({
          name: 'Cliente Indevido',
          email: `${randomUUID()}@e2e-helper.test`,
          password: 'SenhaForte@2026',
          role: 'CUSTOMER',
        })
        .expect(400);
    });
  });
});
