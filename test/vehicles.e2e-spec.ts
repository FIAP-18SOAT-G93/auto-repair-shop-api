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

describe('Veículos (e2e)', () => {
  let app: INestApplication<App>;
  let attendant: string;
  let mechanic: string;
  let manager: string;
  const customerIds: string[] = [];
  const vehicleIds: string[] = [];

  const api = () => request(app.getHttpServer());

  async function createCustomer(): Promise<string> {
    const response = await api()
      .post('/customers')
      .set('Authorization', `Bearer ${attendant}`)
      .send({ name: 'Dono E2E', document: generateCpf() })
      .expect(201);
    customerIds.push(response.body.id as string);
    return response.body.id as string;
  }

  const newVehicle = (customerId: string) => ({
    customerId,
    plate: generatePlate(),
    brand: 'Volkswagen',
    model: 'Gol',
    year: 2020,
  });

  async function createVehicle(body: ReturnType<typeof newVehicle>) {
    const response = await api()
      .post('/vehicles')
      .set('Authorization', `Bearer ${attendant}`)
      .send(body)
      .expect(201);
    vehicleIds.push(response.body.id as string);
    return response.body as { id: string; plate: string };
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
    const client = app?.get(PrismaTransactionHost).client;
    await client?.vehicle.deleteMany({ where: { id: { in: vehicleIds } } });
    await client?.customer.deleteMany({ where: { id: { in: customerIds } } });
    if (app) await removeHelperUsers(app);
    await app?.close();
  });

  describe('cadastro', () => {
    it('cadastra o veículo do cliente', async () => {
      const customerId = await createCustomer();

      const created = await createVehicle(newVehicle(customerId));

      expect(created.plate).toMatch(/^[A-Z]{3}\d[A-Z]\d{2}$/);
    });

    it('responde 403 para o mecânico', async () => {
      const customerId = await createCustomer();

      await api()
        .post('/vehicles')
        .set('Authorization', `Bearer ${mechanic}`)
        .send(newVehicle(customerId))
        .expect(403);
    });

    it.each<[Record<string, unknown>, string]>([
      [{ plate: 'ABCD123' }, 'placa inválida'],
      [{ year: 1800 }, 'ano fora do intervalo'],
      [{ brand: 'X'.repeat(61) }, 'marca longa demais'],
      [{ model: 'Y'.repeat(61) }, 'modelo longo demais'],
      [{ customerId: 'nao-e-uuid' }, 'customerId que não é UUID'],
    ])('responde 400 para %o (%s)', async (override) => {
      const customerId = await createCustomer();

      await api()
        .post('/vehicles')
        .set('Authorization', `Bearer ${attendant}`)
        .send({ ...newVehicle(customerId), ...override })
        .expect(400);
    });

    it('responde 404 para cliente inexistente', async () => {
      await api()
        .post('/vehicles')
        .set('Authorization', `Bearer ${attendant}`)
        .send(newVehicle(randomUUID()))
        .expect(404);
    });

    it('responde 409 para placa já cadastrada', async () => {
      const customerId = await createCustomer();
      const body = newVehicle(customerId);
      await createVehicle(body);

      await api()
        .post('/vehicles')
        .set('Authorization', `Bearer ${attendant}`)
        .send(body)
        .expect(409);
    });
  });

  describe('consultas', () => {
    it('busca pela placa e lista os veículos do cliente', async () => {
      const customerId = await createCustomer();
      const created = await createVehicle(newVehicle(customerId));
      await createVehicle(newVehicle(customerId));

      const found = await api()
        .get('/vehicles/search')
        .query({ plate: created.plate.toLowerCase() })
        .set('Authorization', `Bearer ${mechanic}`)
        .expect(200);
      expect(found.body.id).toBe(created.id);

      const list = await api()
        .get('/vehicles')
        .query({ customerId })
        .set('Authorization', `Bearer ${mechanic}`)
        .expect(200);
      expect(list.body.total).toBe(2);
    });

    it('responde 400 para customerId inválido na listagem', async () => {
      await api()
        .get('/vehicles?customerId=nao-e-uuid')
        .set('Authorization', `Bearer ${mechanic}`)
        .expect(400);
    });
  });

  describe('alteração e remoção', () => {
    it('altera o veículo, mas recusa trocar a placa', async () => {
      const customerId = await createCustomer();
      const created = await createVehicle(newVehicle(customerId));

      await api()
        .put(`/vehicles/${created.id}`)
        .set('Authorization', `Bearer ${attendant}`)
        .send({ brand: 'Fiat', model: 'Uno', year: 2015 })
        .expect(200);
      await api()
        .put(`/vehicles/${created.id}`)
        .set('Authorization', `Bearer ${attendant}`)
        .send({
          brand: 'Fiat',
          model: 'Uno',
          year: 2015,
          plate: generatePlate(),
        })
        .expect(400);
    });

    it('remove pelo gestor e libera a placa', async () => {
      const customerId = await createCustomer();
      const body = newVehicle(customerId);
      const created = await createVehicle(body);

      await api()
        .delete(`/vehicles/${created.id}`)
        .set('Authorization', `Bearer ${manager}`)
        .expect(204);
      await api()
        .get(`/vehicles/${created.id}`)
        .set('Authorization', `Bearer ${manager}`)
        .expect(404);
      await createVehicle(body);
    });

    it('o cliente com veículo não pode ser removido', async () => {
      const customerId = await createCustomer();
      const body = newVehicle(customerId);
      await createVehicle(body);

      await api()
        .delete(`/customers/${customerId}`)
        .set('Authorization', `Bearer ${manager}`)
        .expect(409);
      await api()
        .get(`/customers/${customerId}`)
        .set('Authorization', `Bearer ${manager}`)
        .expect(200);
    });
  });
});
