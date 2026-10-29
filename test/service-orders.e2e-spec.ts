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
  number: number;
  customerId: string;
  vehicleId: string;
  status: string;
  services: { serviceId: string; price: number }[];
  parts: { partId: string; quantity: number; total: number }[];
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

  async function openOrder(body = newCustomerAndVehicle()): Promise<OrderBody> {
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

  async function orderInDiagnosis(): Promise<OrderBody> {
    const order = await openOrder();
    await api()
      .post(`/service-orders/${order.id}/start-diagnosis`)
      .set(auth(mechanic))
      .expect(200);
    return order;
  }

  const stockOf = async () =>
    (await api().get(`/parts/${partId}`).set(auth(manager)).expect(200)).body
      .quantity as number;

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
        quantity: 10,
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
    await client?.part.deleteMany({ where: { id: partId } });
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
