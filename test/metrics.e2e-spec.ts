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

interface ServiceAverage {
  serviceId: string;
  averageMinutes: number | null;
  orders: number;
}

describe('Métricas (e2e)', () => {
  let app: INestApplication<App>;
  let attendant: string;
  let mechanic: string;
  let manager: string;
  let alignmentId: string;
  let brakesId: string;
  const orderIds: string[] = [];
  const customerIds = new Set<string>();
  const vehicleIds = new Set<string>();

  const api = () => request(app.getHttpServer());
  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
  const command = (id: string, action: string, token: string) =>
    api().post(`/service-orders/${id}/${action}`).set(auth(token));

  async function createService(name: string): Promise<string> {
    const response = await api()
      .post('/services')
      .set(auth(manager))
      .send({
        name: `${name} ${randomUUID()}`,
        price: 100,
        estimatedMinutes: 30,
      })
      .expect(201);
    return response.body.id as string;
  }

  async function awaitingApproval(serviceId: string): Promise<string> {
    const opened = await api()
      .post('/service-orders')
      .set(auth(attendant))
      .send({
        customer: { document: generateCpf(), name: 'Cliente Métricas E2E' },
        vehicle: {
          plate: generatePlate(),
          brand: 'Fiat',
          model: 'Uno',
          year: 2015,
        },
      })
      .expect(201);
    const { id, customerId, vehicleId } = opened.body as {
      id: string;
      customerId: string;
      vehicleId: string;
    };
    orderIds.push(id);
    customerIds.add(customerId);
    vehicleIds.add(vehicleId);

    await command(id, 'start-diagnosis', mechanic).expect(200);
    await command(id, 'services', mechanic).send({ serviceId }).expect(200);
    await command(id, 'conclude-diagnosis', mechanic).expect(200);
    return id;
  }

  const decide = (id: string, decision: string, version: number) =>
    command(id, `${decision}-quote`, attendant).send({ version }).expect(200);

  const metrics = async () => {
    const response = await api()
      .get('/metrics/average-execution-time')
      .set(auth(manager))
      .expect(200);
    return response.body as {
      overall: { averageMinutes: number | null; orders: number };
      byService: ServiceAverage[];
    };
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();

    attendant = await tokenFor(app, Role.ATTENDANT);
    mechanic = await tokenFor(app, Role.MECHANIC);
    manager = await tokenFor(app, Role.MANAGER);
    alignmentId = await createService('Alinhamento Métricas E2E');
    brakesId = await createService('Freios Métricas E2E');

    const finished = await awaitingApproval(alignmentId);
    await decide(finished, 'approve', 1);
    await command(finished, 'finish', mechanic).expect(200);

    const rejected = await awaitingApproval(alignmentId);
    await decide(rejected, 'reject', 1);

    const withRejectedRepair = await awaitingApproval(alignmentId);
    await decide(withRejectedRepair, 'approve', 1);
    await command(withRejectedRepair, 'additional-repair', mechanic)
      .send({ services: [brakesId] })
      .expect(200);
    await decide(withRejectedRepair, 'reject', 2);
    await command(withRejectedRepair, 'finish', mechanic).expect(200);

    await awaitingApproval(brakesId);
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
    await client?.service.deleteMany({
      where: { id: { in: [alignmentId, brakesId] } },
    });
    if (app) await removeHelperUsers(app);
    await app?.close();
  });

  it('conta no serviço só as OS em que ele foi executado até a finalização', async () => {
    const { byService } = await metrics();

    const alignment = byService.find((s) => s.serviceId === alignmentId);
    expect(alignment?.orders).toBe(2);
    expect(alignment?.averageMinutes).toBeGreaterThanOrEqual(0);
  });

  it('não atribui tempo ao serviço de um reparo adicional rejeitado nem de uma OS sem decisão', async () => {
    const { byService } = await metrics();

    expect(byService.map((s) => s.serviceId)).not.toContain(brakesId);
  });

  it('a média geral considera as OS finalizadas', async () => {
    const { overall } = await metrics();

    expect(overall.orders).toBeGreaterThanOrEqual(2);
    expect(overall.averageMinutes).toBeGreaterThanOrEqual(0);
  });

  it.each([
    ['o atendente', () => attendant],
    ['o mecânico', () => mechanic],
  ])('responde 403 para %s', async (_role, token) => {
    await api()
      .get('/metrics/average-execution-time')
      .set(auth(token()))
      .expect(403);
  });
});
