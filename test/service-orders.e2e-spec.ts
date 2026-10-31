import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { Role } from '../src/modules/auth/domain/role.js';
import { generateCpf } from '../src/modules/customer/testing/document-generator.js';
import { generatePlate } from '../src/modules/customer/testing/plate-generator.js';
import type { OpenServiceOrderInput } from '../src/modules/service-order/application/open-service-order.use-case.js';
import { PrismaTransactionHost } from '../src/shared/infrastructure/database/prisma-transaction-host.js';
import { removeHelperUsers, tokenFor } from './helpers/auth.js';

interface OrderBody {
  id: string;
  number: number;
  customerId: string;
  vehicleId: string;
  status: string;
  services: { serviceId: string; price: number }[];
  parts: { partId: string; quantity: number; total: number }[];
  quotes: {
    version: number;
    total: number;
    decision: string | null;
    rejectionReason: string | null;
  }[];
  history: { to: string }[];
  approvedTotal: number;
  totalIfApproved: number;
}

describe('Ordens de serviço (e2e)', () => {
  let app: INestApplication<App>;
  let attendant: string;
  let mechanic: string;
  let manager: string;
  let serviceId: string;
  let partId: string;
  const orderIds: string[] = [];
  const customerIds = new Set<string>();
  const vehicleIds = new Set<string>();
  const extraPartIds: string[] = [];

  const api = () => request(app.getHttpServer());
  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

  const newCustomerAndVehicle = () => ({
    customer: { document: generateCpf(), name: 'Cliente OS E2E' },
    vehicle: {
      plate: generatePlate(),
      brand: 'Fiat',
      model: 'Uno',
      year: 2015,
    },
  });

  async function openOrder(
    body: OpenServiceOrderInput = newCustomerAndVehicle(),
  ): Promise<OrderBody> {
    const response = await api()
      .post('/service-orders')
      .set(auth(attendant))
      .send(body)
      .expect(201);
    const order = response.body as OrderBody;
    orderIds.push(order.id);
    customerIds.add(order.customerId);
    vehicleIds.add(order.vehicleId);
    return order;
  }

  async function orderInDiagnosis(
    body = newCustomerAndVehicle(),
  ): Promise<OrderBody> {
    const order = await openOrder(body);
    await api()
      .post(`/service-orders/${order.id}/start-diagnosis`)
      .set(auth(mechanic))
      .expect(200);
    return order;
  }

  async function orderAwaitingApproval(
    part = partId,
    body = newCustomerAndVehicle(),
  ): Promise<OrderBody> {
    const order = await orderInDiagnosis(body);
    await api()
      .post(`/service-orders/${order.id}/services`)
      .set(auth(mechanic))
      .send({ serviceId })
      .expect(200);
    await api()
      .post(`/service-orders/${order.id}/parts`)
      .set(auth(mechanic))
      .send({ partId: part, quantity: 2 })
      .expect(200);
    const response = await api()
      .post(`/service-orders/${order.id}/conclude-diagnosis`)
      .set(auth(mechanic))
      .expect(200);
    return response.body as OrderBody;
  }

  const decide = (
    order: OrderBody,
    decision: 'approve' | 'reject',
    body: Record<string, unknown>,
  ) =>
    api()
      .post(`/service-orders/${order.id}/${decision}-quote`)
      .set(auth(attendant))
      .send(body);

  async function orderInExecution(
    body = newCustomerAndVehicle(),
  ): Promise<OrderBody> {
    const order = await orderAwaitingApproval(partId, body);
    const response = await decide(order, 'approve', { version: 1 }).expect(200);
    return response.body as OrderBody;
  }

  const command = (order: OrderBody, action: string, token: string) =>
    api().post(`/service-orders/${order.id}/${action}`).set(auth(token));

  const stockOf = async (id = partId) =>
    (await api().get(`/parts/${id}`).set(auth(manager)).expect(200)).body
      .quantity as number;

  async function createPart(quantity: number): Promise<string> {
    const response = await api()
      .post('/parts')
      .set(auth(manager))
      .send({
        name: `Peça OS E2E ${randomUUID()}`,
        type: 'PART',
        price: 50,
        quantity,
      })
      .expect(201);
    const id = response.body.id as string;
    extraPartIds.push(id);
    return id;
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

    const service = await api()
      .post('/services')
      .set(auth(manager))
      .send({
        name: `Serviço OS E2E ${randomUUID()}`,
        price: 89.9,
        estimatedMinutes: 40,
      })
      .expect(201);
    serviceId = service.body.id as string;

    const part = await api()
      .post('/parts')
      .set(auth(manager))
      .send({
        name: `Peça OS E2E ${randomUUID()}`,
        type: 'PART',
        price: 149.9,
        quantity: 50,
      })
      .expect(201);
    partId = part.body.id as string;
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
    await client?.part.deleteMany({
      where: { id: { in: [partId, ...extraPartIds] } },
    });
    if (app) await removeHelperUsers(app);
    await app?.close();
  });

  describe('abertura', () => {
    it('o atendente abre a OS cadastrando cliente e veículo novos', async () => {
      const order = await openOrder();

      expect(order.number).toBeGreaterThan(0);
      expect(order.status).toBe('RECEIVED');
    });

    it('recusa uma segunda OS aberta, mesmo só com documento e placa', async () => {
      const body = newCustomerAndVehicle();
      await openOrder(body);

      await api()
        .post('/service-orders')
        .set(auth(attendant))
        .send({
          customer: { document: body.customer.document },
          vehicle: { plate: body.vehicle.plate },
        })
        .expect(409);
    });

    it('responde 403 para o mecânico', async () => {
      await api()
        .post('/service-orders')
        .set(auth(mechanic))
        .send(newCustomerAndVehicle())
        .expect(403);
    });

    it.each<[Record<string, unknown>, string]>([
      [{ vehicle: undefined }, 'sem veículo'],
      [{ customer: { document: '' } }, 'documento vazio'],
      [
        { customer: { document: generateCpf(), email: 'nao-e-email' } },
        'e-mail inválido no cliente aninhado',
      ],
      [
        { vehicle: { plate: generatePlate(), color: 'azul' } },
        'campo desconhecido no veículo aninhado',
      ],
      [{ customer: { document: generateCpf() } }, 'cliente novo sem nome'],
    ])('responde 400 para %s (%s)', async (override) => {
      await api()
        .post('/service-orders')
        .set(auth(attendant))
        .send({ ...newCustomerAndVehicle(), ...override })
        .expect(400);
    });
  });

  describe('diagnóstico e itens', () => {
    it('inclui serviço e peça, com baixa no estoque', async () => {
      const order = await orderInDiagnosis();
      const stockBefore = await stockOf();

      await api()
        .post(`/service-orders/${order.id}/services`)
        .set(auth(mechanic))
        .send({ serviceId })
        .expect(200);
      const response = await api()
        .post(`/service-orders/${order.id}/parts`)
        .set(auth(mechanic))
        .send({ partId, quantity: 2 })
        .expect(200);

      const body = response.body as OrderBody;
      expect(body.status).toBe('IN_DIAGNOSIS');
      expect(body.services).toEqual([
        expect.objectContaining({ serviceId, price: 89.9 }),
      ]);
      expect(body.parts).toEqual([
        expect.objectContaining({ partId, quantity: 2, total: 299.8 }),
      ]);
      expect(await stockOf()).toBe(stockBefore - 2);
    });

    it('sem saldo, responde 409 e não grava nada', async () => {
      const order = await orderInDiagnosis();
      const stockBefore = await stockOf();

      await api()
        .post(`/service-orders/${order.id}/parts`)
        .set(auth(mechanic))
        .send({ partId, quantity: 1000 })
        .expect(409);

      const detail = await api()
        .get(`/service-orders/${order.id}`)
        .set(auth(mechanic))
        .expect(200);
      expect((detail.body as OrderBody).parts).toHaveLength(0);
      expect(await stockOf()).toBe(stockBefore);
    });

    it('fora do diagnóstico, responde 409 sem mexer no estoque', async () => {
      const order = await openOrder();
      const stockBefore = await stockOf();

      await api()
        .post(`/service-orders/${order.id}/parts`)
        .set(auth(mechanic))
        .send({ partId, quantity: 1 })
        .expect(409);

      expect(await stockOf()).toBe(stockBefore);
    });

    it('responde 404 para serviço inexistente no catálogo', async () => {
      const order = await orderInDiagnosis();

      await api()
        .post(`/service-orders/${order.id}/services`)
        .set(auth(mechanic))
        .send({ serviceId: randomUUID() })
        .expect(404);
    });

    it('responde 403 para o atendente incluir itens', async () => {
      const order = await orderInDiagnosis();

      await api()
        .post(`/service-orders/${order.id}/services`)
        .set(auth(attendant))
        .send({ serviceId })
        .expect(403);
    });
  });

  describe('orçamento', () => {
    it('concluir o diagnóstico gera o orçamento e aguarda aprovação', async () => {
      const order = await orderAwaitingApproval();

      expect(order.status).toBe('AWAITING_APPROVAL');
      expect(order.quotes).toEqual([
        expect.objectContaining({ version: 1, total: 389.7, decision: null }),
      ]);
    });

    it('sem itens, a conclusão do diagnóstico responde 409', async () => {
      const order = await orderInDiagnosis();

      await api()
        .post(`/service-orders/${order.id}/conclude-diagnosis`)
        .set(auth(mechanic))
        .expect(409);
    });

    it('a aprovação leva a OS para Em execução, uma única vez', async () => {
      const order = await orderAwaitingApproval();

      const response = await decide(order, 'approve', { version: 1 }).expect(
        200,
      );

      expect((response.body as OrderBody).status).toBe('IN_EXECUTION');
      await decide(order, 'approve', { version: 1 }).expect(409);
    });

    it('a rejeição finaliza sem execução, guarda o motivo e devolve o estoque', async () => {
      const stockBefore = await stockOf();
      const order = await orderAwaitingApproval();
      expect(await stockOf()).toBe(stockBefore - 2);

      await decide(order, 'reject', {
        version: 1,
        reason: 'Valor acima do esperado',
      }).expect(200);

      const detail = await api()
        .get(`/service-orders/${order.id}`)
        .set(auth(attendant))
        .expect(200);
      const body = detail.body as OrderBody;
      expect(body.status).toBe('FINISHED');
      expect(body.quotes).toEqual([
        expect.objectContaining({
          decision: 'REJECTED',
          rejectionReason: 'Valor acima do esperado',
        }),
      ]);
      expect(body.history.map((change) => change.to)).not.toContain(
        'IN_EXECUTION',
      );
      expect(await stockOf()).toBe(stockBefore);
    });

    it('uma decisão sobre outra versão responde 409 sem mexer no estoque', async () => {
      const order = await orderAwaitingApproval();
      const stockBefore = await stockOf();

      await decide(order, 'reject', { version: 2 }).expect(409);

      expect(await stockOf()).toBe(stockBefore);
    });

    it('rejeita mesmo que a peça tenha sido removida do catálogo', async () => {
      const part = await api()
        .post('/parts')
        .set(auth(manager))
        .send({
          name: `Insumo removido E2E ${randomUUID()}`,
          type: 'SUPPLY',
          price: 25,
          quantity: 5,
        })
        .expect(201);
      const removedPartId = part.body.id as string;
      extraPartIds.push(removedPartId);
      const order = await orderAwaitingApproval(removedPartId);
      await api()
        .delete(`/parts/${removedPartId}`)
        .set(auth(manager))
        .expect(204);

      await decide(order, 'reject', { version: 1 }).expect(200);
    });

    it.each<[string, Record<string, unknown>]>([
      ['sem versão', {}],
      ['versão zero', { version: 0 }],
      ['versão fracionada', { version: 1.5 }],
      ['motivo longo demais', { version: 1, reason: 'x'.repeat(501) }],
      ['campo desconhecido', { version: 1, approved: false }],
    ])('responde 400 para %s', async (_case, body) => {
      await api()
        .post(`/service-orders/${randomUUID()}/reject-quote`)
        .set(auth(attendant))
        .send(body)
        .expect(400);
    });

    it('responde 403 para o mecânico decidir o orçamento', async () => {
      await api()
        .post(`/service-orders/${randomUUID()}/approve-quote`)
        .set(auth(mechanic))
        .send({ version: 1 })
        .expect(403);
    });
  });

  describe('reparo adicional', () => {
    it('gera a versão 2 do orçamento, dá baixa e volta para Aguardando aprovação', async () => {
      const order = await orderInExecution();
      const stockBefore = await stockOf();

      const response = await command(order, 'additional-repair', mechanic)
        .send({ services: [serviceId], parts: [{ partId, quantity: 1 }] })
        .expect(200);

      const body = response.body as OrderBody;
      expect(body.status).toBe('AWAITING_APPROVAL');
      expect(body.quotes).toEqual([
        expect.objectContaining({ version: 1, decision: 'APPROVED' }),
        expect.objectContaining({ version: 2, total: 239.8, decision: null }),
      ]);
      expect(body.services).toHaveLength(2);
      expect(body.approvedTotal).toBe(389.7);
      expect(body.totalIfApproved).toBe(629.5);
      expect(await stockOf()).toBe(stockBefore - 1);
    });

    it('a rejeição do reparo adicional estorna as peças dele e o serviço aprovado continua até a entrega', async () => {
      const order = await orderInExecution();
      const stockBefore = await stockOf();
      await command(order, 'additional-repair', mechanic)
        .send({ parts: [{ partId, quantity: 1 }] })
        .expect(200);

      const rejected = await decide(order, 'reject', {
        version: 2,
        reason: 'Fica para a próxima revisão',
      }).expect(200);

      expect((rejected.body as OrderBody).status).toBe('IN_EXECUTION');
      expect((rejected.body as OrderBody).approvedTotal).toBe(389.7);
      expect(await stockOf()).toBe(stockBefore);
      await command(order, 'finish', mechanic).expect(200);
      await command(order, 'deliver', attendant).expect(200);
    });

    it('sem saldo de uma das peças, desfaz a baixa das outras', async () => {
      const order = await orderInExecution();
      const scarcePartId = await createPart(1);
      const stockBefore = await stockOf();

      await command(order, 'additional-repair', mechanic)
        .send({
          parts: [
            { partId, quantity: 1 },
            { partId: scarcePartId, quantity: 5 },
          ],
        })
        .expect(409);

      expect(await stockOf()).toBe(stockBefore);
      expect(await stockOf(scarcePartId)).toBe(1);
      const detail = await api()
        .get(`/service-orders/${order.id}`)
        .set(auth(mechanic))
        .expect(200);
      expect((detail.body as OrderBody).status).toBe('IN_EXECUTION');
      expect((detail.body as OrderBody).parts).toHaveLength(1);
    });

    it('sem nenhum item, o domínio responde 400', async () => {
      const order = await orderInExecution();

      await command(order, 'additional-repair', mechanic).send({}).expect(400);
    });

    it.each<[string, Record<string, unknown>]>([
      ['serviço com id inválido', { services: ['nao-e-uuid'] }],
      ['peça sem quantidade', { parts: [{ partId: randomUUID() }] }],
      [
        'campo desconhecido na peça',
        { parts: [{ partId: randomUUID(), quantity: 1, price: 10 }] },
      ],
    ])('responde 400 para %s, antes do caso de uso', async (_case, body) => {
      const order = { id: randomUUID() } as OrderBody;

      await command(order, 'additional-repair', mechanic)
        .send(body)
        .expect(400);
    });
  });

  describe('finalização e entrega', () => {
    it('finaliza, entrega e libera o veículo para uma nova OS', async () => {
      const body = newCustomerAndVehicle();
      const order = await orderInExecution(body);

      const finished = await command(order, 'finish', mechanic).expect(200);
      const delivered = await command(order, 'deliver', attendant).expect(200);

      expect((finished.body as OrderBody).status).toBe('FINISHED');
      expect((delivered.body as OrderBody).status).toBe('DELIVERED');
      await openOrder({
        customer: { document: body.customer.document },
        vehicle: { plate: body.vehicle.plate },
      });
    });

    it('entrega o veículo de uma OS com o orçamento rejeitado', async () => {
      const order = await orderAwaitingApproval();
      await decide(order, 'reject', { version: 1 }).expect(200);

      await command(order, 'deliver', attendant).expect(200);
    });

    it('não entrega o veículo de uma OS em execução', async () => {
      const order = await orderInExecution();

      await command(order, 'deliver', attendant).expect(409);
    });

    it('o atendente não finaliza e o mecânico não entrega', async () => {
      const order = { id: randomUUID() } as OrderBody;

      await command(order, 'finish', attendant).expect(403);
      await command(order, 'deliver', mechanic).expect(403);
    });
  });

  describe('listagem', () => {
    const todayInBrasilia = () =>
      new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10);

    async function twoOrdersOfOneCustomer() {
      const body = newCustomerAndVehicle();
      const first = await openOrder(body);
      const second = await orderInDiagnosis({
        customer: { document: body.customer.document, name: 'Cliente OS E2E' },
        vehicle: newCustomerAndVehicle().vehicle,
      });
      return { first, second, customerId: first.customerId };
    }

    const list = (query: Record<string, string | number>) =>
      api().get('/service-orders').query(query).set(auth(mechanic));

    it('lista as OS do cliente em resumo, da mais recente para a mais antiga', async () => {
      const { first, second, customerId } = await twoOrdersOfOneCustomer();

      const response = await list({ customerId }).expect(200);

      expect(response.body).toMatchObject({ total: 2, page: 1, pageSize: 20 });
      const items = response.body.items as OrderBody[];
      expect(items.map((order) => order.id)).toEqual([second.id, first.id]);
      expect(items[0]).not.toHaveProperty('services');
    });

    it('filtra pelo status e pelo período de abertura', async () => {
      const { second, customerId } = await twoOrdersOfOneCustomer();
      const today = todayInBrasilia();

      const inDiagnosis = await list({
        customerId,
        status: 'IN_DIAGNOSIS',
      }).expect(200);
      const openedToday = await list({
        customerId,
        openedFrom: today,
        openedTo: today,
      }).expect(200);
      const openedLongAgo = await list({
        customerId,
        openedTo: '2000-01-01',
      }).expect(200);

      expect(
        (inDiagnosis.body.items as OrderBody[]).map((order) => order.id),
      ).toEqual([second.id]);
      expect(openedToday.body.total).toBe(2);
      expect(openedLongAgo.body.total).toBe(0);
    });

    it.each<[string, Record<string, string | number>]>([
      ['status desconhecido', { status: 'OPEN' }],
      ['customerId inválido', { customerId: 'nao-e-uuid' }],
      ['data inexistente', { openedFrom: '2026-02-30' }],
      ['data fora do formato', { openedTo: '31/10/2026' }],
      ['página grande demais', { pageSize: 101 }],
      ['filtro desconhecido', { plate: 'ABC1234' }],
    ])('responde 400 para %s', async (_case, query) => {
      await list(query).expect(400);
    });
  });

  describe('consultas e integração com o cadastro', () => {
    it('responde 404 para OS inexistente', async () => {
      await api()
        .get(`/service-orders/${randomUUID()}`)
        .set(auth(mechanic))
        .expect(404);
    });

    it('bloqueia a remoção de cliente e veículo com OS aberta', async () => {
      const order = await openOrder();

      await api()
        .delete(`/vehicles/${order.vehicleId}`)
        .set(auth(manager))
        .expect(409);
      await api()
        .delete(`/customers/${order.customerId}`)
        .set(auth(manager))
        .expect(409);
    });
  });
});
