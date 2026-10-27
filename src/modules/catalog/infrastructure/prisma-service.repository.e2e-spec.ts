import { randomUUID } from 'node:crypto';
import { ConfigModule } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { Money } from '../../../shared/domain/money.js';
import { validateEnv } from '../../../shared/infrastructure/config/env.validation.js';
import { PrismaModule } from '../../../shared/infrastructure/database/prisma.module.js';
import { PrismaTransactionHost } from '../../../shared/infrastructure/database/prisma-transaction-host.js';
import { ServiceNotFoundError } from '../domain/service.errors.js';
import { Service } from '../domain/service.js';
import { PrismaServiceRepository } from './prisma-service.repository.js';

describe('PrismaServiceRepository (integração)', () => {
  let moduleRef: TestingModule;
  let services: PrismaServiceRepository;
  let host: PrismaTransactionHost;
  const serviceIds: string[] = [];

  async function newService(): Promise<Service> {
    const service = Service.create({
      name: `Serviço E2E ${randomUUID()}`,
      description: 'Criado pelo teste de integração',
      price: Money.fromDecimal(89.9),
      estimatedMinutes: 40,
    });
    await services.save(service);
    serviceIds.push(service.id);
    return service;
  }

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
        PrismaModule,
      ],
      providers: [PrismaServiceRepository],
    }).compile();
    await moduleRef.init();

    services = moduleRef.get(PrismaServiceRepository);
    host = moduleRef.get(PrismaTransactionHost);
  });

  afterAll(async () => {
    await host?.client.service.deleteMany({
      where: { id: { in: serviceIds } },
    });
    await moduleRef?.close();
  });

  it('grava e lê o serviço de volta, com o preço em centavos', async () => {
    const created = await newService();

    const found = await services.findById(created.id);

    expect(found?.name).toBe(created.name);
    expect(found?.description).toBe('Criado pelo teste de integração');
    expect(found?.price.equals(Money.fromCents(8990))).toBe(true);
    expect(found?.estimatedMinutes).toBe(40);
  });

  it('guarda o preço como inteiro de centavos na coluna', async () => {
    const created = await newService();

    const row = await host.client.service.findUniqueOrThrow({
      where: { id: created.id },
    });

    expect(row.priceCents).toBe(8990);
  });

  it('atualiza o serviço existente em vez de criar outro', async () => {
    const service = await newService();
    service.update({
      name: 'Alinhamento e balanceamento',
      price: Money.fromDecimal(120),
      estimatedMinutes: 50,
    });

    await services.save(service);

    const found = await services.findById(service.id);
    expect(found?.name).toBe('Alinhamento e balanceamento');
    expect(found?.price.cents).toBe(12000);
    expect(found?.description).toBeNull();
  });

  it('responde null para id inexistente', async () => {
    expect(await services.findById(randomUUID())).toBeNull();
  });

  it('apaga a linha do banco e tira o serviço da listagem', async () => {
    const kept = await newService();
    const removed = await newService();

    await services.delete(removed.id);

    expect(
      await host.client.service.findUnique({ where: { id: removed.id } }),
    ).toBeNull();
    const ids = (await services.list(1, 100)).items.map((s) => s.id);
    expect(ids).toContain(kept.id);
    expect(ids).not.toContain(removed.id);
  });

  it('converte remoção de id inexistente em ServiceNotFoundError', async () => {
    await expect(services.delete(randomUUID())).rejects.toThrow(
      ServiceNotFoundError,
    );
  });
});
