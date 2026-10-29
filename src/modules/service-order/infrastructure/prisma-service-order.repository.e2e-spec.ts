import { randomUUID } from 'node:crypto';
import { ConfigModule } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { UnitOfWork } from '../../../shared/application/unit-of-work.js';
import { Money } from '../../../shared/domain/money.js';
import { Quantity } from '../../../shared/domain/quantity.js';
import { validateEnv } from '../../../shared/infrastructure/config/env.validation.js';
import { PrismaModule } from '../../../shared/infrastructure/database/prisma.module.js';
import { PrismaTransactionHost } from '../../../shared/infrastructure/database/prisma-transaction-host.js';
import { VehicleHasOpenServiceOrderError } from '../domain/service-order.errors.js';
import { ServiceOrder } from '../domain/service-order.js';
import { PrismaServiceOrderRepository } from './prisma-service-order.repository.js';

describe('PrismaServiceOrderRepository (integração)', () => {
  let moduleRef: TestingModule;
  let orders: PrismaServiceOrderRepository;
  let host: PrismaTransactionHost;
  const orderIds: string[] = [];

  const at = (time: string) => new Date(`2026-10-28T${time}:00Z`);

  async function newOrder(
    vehicleId = randomUUID(),
    customerId = randomUUID(),
  ): Promise<ServiceOrder> {
    const order = ServiceOrder.open(
      { number: await orders.nextNumber(), customerId, vehicleId },
      at('08:00'),
    );
    orderIds.push(order.id);
    return order;
  }

  function progressToExecution(order: ServiceOrder): void {
    order.startDiagnosis(at('09:00'));
    order.addService({
      serviceId: randomUUID(),
      name: 'Alinhamento',
      price: Money.fromDecimal(89.9),
    });
    order.addPart({
      partId: randomUUID(),
      name: 'Pastilha de freio dianteira',
      unitPrice: Money.fromDecimal(149.9),
      quantity: Quantity.of(2),
    });
    order.concludeDiagnosis(at('10:00'));
    order.approve(1, at('11:00'));
  }

  function deliver(order: ServiceOrder): void {
    progressToExecution(order);
    order.finish(at('13:00'));
    order.deliver(at('15:00'));
  }

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
        PrismaModule,
      ],
      providers: [PrismaServiceOrderRepository],
    }).compile();
    await moduleRef.init();

    orders = moduleRef.get(PrismaServiceOrderRepository);
    host = moduleRef.get(PrismaTransactionHost);
  });

  afterAll(async () => {
    await host?.client.serviceOrder.deleteMany({
      where: { id: { in: orderIds } },
    });
    await moduleRef?.close();
  });

  it('gera números de OS crescentes', async () => {
    const first = await orders.nextNumber();
    const second = await orders.nextNumber();

    expect(second).toBeGreaterThan(first);
  });

  it('grava e lê a OS com itens, orçamento e histórico', async () => {
    const order = await newOrder();
    progressToExecution(order);

    await orders.save(order);
    const found = await orders.findById(order.id);

    expect(found?.number).toBe(order.number);
    expect(found?.status).toBe('IN_EXECUTION');
    expect(found?.serviceItems[0]?.name).toBe('Alinhamento');
    expect(found?.partItems[0]?.total.cents).toBe(29980);
    expect(found?.currentQuote?.decision).toBe('APPROVED');
    expect(found?.currentQuote?.total.toDecimal()).toBe(389.7);
    expect(found?.history.entries.map((change) => change.to)).toEqual([
      'RECEIVED',
      'IN_DIAGNOSIS',
      'AWAITING_APPROVAL',
      'IN_EXECUTION',
    ]);
    expect(found?.pullDomainEvents()).toHaveLength(0);
  });

  it('salvar de novo substitui os filhos, sem duplicar', async () => {
    const order = await newOrder();
    await orders.save(order);

    progressToExecution(order);
    await orders.save(order);
    await orders.save(order);

    const found = await orders.findById(order.id);
    expect(found?.serviceItems).toHaveLength(1);
    expect(found?.quotes).toHaveLength(1);
    expect(found?.history.entries).toHaveLength(4);
  });

  it('lê a OS travando a linha dentro de uma transação', async () => {
    const order = await newOrder();
    await orders.save(order);

    const locked = await moduleRef
      .get(UnitOfWork)
      .run(() => orders.findByIdForUpdate(order.id));

    expect(locked?.id).toBe(order.id);
  });

  it('responde null para id inexistente', async () => {
    expect(await orders.findById(randomUUID())).toBeNull();
  });

  describe('uma OS aberta por veículo', () => {
    it('recusa abrir uma segunda OS para o mesmo veículo', async () => {
      const vehicleId = randomUUID();
      await orders.save(await newOrder(vehicleId));

      await expect(orders.save(await newOrder(vehicleId))).rejects.toThrow(
        VehicleHasOpenServiceOrderError,
      );
    });

    it('libera uma nova OS depois da entrega do veículo', async () => {
      const vehicleId = randomUUID();
      const delivered = await newOrder(vehicleId);
      deliver(delivered);
      await orders.save(delivered);

      const next = await newOrder(vehicleId);
      await orders.save(next);

      expect((await orders.findOpenByVehicle(vehicleId))?.id).toBe(next.id);
    });
  });

  it('responde se o cliente tem OS aberta', async () => {
    const customerId = randomUUID();
    const order = await newOrder(randomUUID(), customerId);
    await orders.save(order);

    expect(await orders.existsOpenForCustomer(customerId)).toBe(true);
    expect(await orders.existsOpenForCustomer(randomUUID())).toBe(false);

    deliver(order);
    await orders.save(order);
    expect(await orders.existsOpenForCustomer(customerId)).toBe(false);
  });
});
