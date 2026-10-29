import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client.js';
import { UnitOfWork } from '../../../shared/application/unit-of-work.js';
import { Money } from '../../../shared/domain/money.js';
import { Quantity } from '../../../shared/domain/quantity.js';
import { PrismaTransactionHost } from '../../../shared/infrastructure/database/prisma-transaction-host.js';
import { PartItem } from '../domain/part-item.js';
import { Quote } from '../domain/quote.js';
import { ServiceItem } from '../domain/service-item.js';
import { ServiceOrderStatus } from '../domain/service-order-status.js';
import { VehicleHasOpenServiceOrderError } from '../domain/service-order.errors.js';
import { ServiceOrder } from '../domain/service-order.js';
import { ServiceOrderRepository } from '../domain/service-order.repository.js';
import { StatusHistory } from '../domain/status-history.js';

const INCLUDE = {
  serviceItems: { orderBy: { position: 'asc' } },
  partItems: { orderBy: { position: 'asc' } },
  quotes: { orderBy: { version: 'asc' } },
  statusHistory: { orderBy: { position: 'asc' } },
} satisfies Prisma.ServiceOrderInclude;

type ServiceOrderRecord = Prisma.ServiceOrderGetPayload<{
  include: typeof INCLUDE;
}>;

const OPEN = { deliveredAt: null } satisfies Prisma.ServiceOrderWhereInput;

@Injectable()
export class PrismaServiceOrderRepository implements ServiceOrderRepository {
  constructor(
    private readonly host: PrismaTransactionHost,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async nextNumber(): Promise<number> {
    const [row] = await this.host.client.$queryRaw<{ value: bigint }[]>`
      SELECT nextval(pg_get_serial_sequence('service_orders', 'number')) AS value
    `;
    return Number(row.value);
  }

  save(order: ServiceOrder): Promise<void> {
    return this.unitOfWork.run(async () => {
      await this.saveRoot(order);
      await this.replaceChildren(order);
    });
  }

  async findById(id: string): Promise<ServiceOrder | null> {
    const record = await this.host.client.serviceOrder.findUnique({
      where: { id },
      include: INCLUDE,
    });
    return record ? toDomain(record) : null;
  }

  async findByIdForUpdate(id: string): Promise<ServiceOrder | null> {
    await this.host.client.$queryRaw`
      SELECT "id" FROM "service_orders" WHERE "id" = ${id}::uuid FOR UPDATE
    `;
    return this.findById(id);
  }

  async findOpenByVehicle(vehicleId: string): Promise<ServiceOrder | null> {
    const record = await this.host.client.serviceOrder.findFirst({
      where: { vehicleId, ...OPEN },
      include: INCLUDE,
    });
    return record ? toDomain(record) : null;
  }

  async existsOpenForCustomer(customerId: string): Promise<boolean> {
    const record = await this.host.client.serviceOrder.findFirst({
      where: { customerId, ...OPEN },
      select: { id: true },
    });
    return record !== null;
  }

  private async saveRoot(order: ServiceOrder): Promise<void> {
    const data = { status: order.status, deliveredAt: deliveredAtOf(order) };
    try {
      await this.host.client.serviceOrder.upsert({
        where: { id: order.id },
        create: {
          id: order.id,
          number: order.number,
          customerId: order.customerId,
          vehicleId: order.vehicleId,
          createdAt: order.openedAt,
          ...data,
        },
        update: data,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new VehicleHasOpenServiceOrderError();
      }
      throw error;
    }
  }

  private async replaceChildren(order: ServiceOrder): Promise<void> {
    const client = this.host.client;
    const where = { serviceOrderId: order.id };
    const serviceOrderId = order.id;

    await client.serviceOrderServiceItem.deleteMany({ where });
    await client.serviceOrderPartItem.deleteMany({ where });
    await client.serviceOrderQuote.deleteMany({ where });
    await client.serviceOrderStatusChange.deleteMany({ where });

    await client.serviceOrderServiceItem.createMany({
      data: order.serviceItems.map((item, position) => ({
        serviceOrderId,
        position,
        serviceId: item.serviceId,
        name: item.name,
        priceCents: item.price.cents,
        quoteVersion: item.quoteVersion,
      })),
    });
    await client.serviceOrderPartItem.createMany({
      data: order.partItems.map((item, position) => ({
        serviceOrderId,
        position,
        partId: item.partId,
        name: item.name,
        unitPriceCents: item.unitPrice.cents,
        quantity: item.quantity.value,
        quoteVersion: item.quoteVersion,
      })),
    });
    await client.serviceOrderQuote.createMany({
      data: order.quotes.map((quote) => ({
        serviceOrderId,
        version: quote.version,
        totalCents: quote.total.cents,
        generatedAt: quote.generatedAt,
        decision: quote.decision,
        decidedAt: quote.decidedAt,
        rejectionReason: quote.rejectionReason,
      })),
    });
    await client.serviceOrderStatusChange.createMany({
      data: order.history.entries.map((change, position) => ({
        serviceOrderId,
        position,
        fromStatus: change.from,
        toStatus: change.to,
        changedAt: change.changedAt,
      })),
    });
  }
}

function deliveredAtOf(order: ServiceOrder): Date | null {
  return (
    order.history.entries.find(
      (change) => change.to === ServiceOrderStatus.DELIVERED,
    )?.changedAt ?? null
  );
}

function toDomain(record: ServiceOrderRecord): ServiceOrder {
  return ServiceOrder.restore(record.id, {
    number: record.number,
    customerId: record.customerId,
    vehicleId: record.vehicleId,
    history: StatusHistory.restore(
      record.statusHistory.map((change) => ({
        from: change.fromStatus,
        to: change.toStatus,
        changedAt: change.changedAt,
      })),
    ),
    serviceItems: record.serviceItems.map((item) =>
      ServiceItem.create({
        serviceId: item.serviceId,
        name: item.name,
        price: Money.fromCents(item.priceCents),
        quoteVersion: item.quoteVersion,
      }),
    ),
    partItems: record.partItems.map((item) =>
      PartItem.create({
        partId: item.partId,
        name: item.name,
        unitPrice: Money.fromCents(item.unitPriceCents),
        quantity: Quantity.of(item.quantity),
        quoteVersion: item.quoteVersion,
      }),
    ),
    quotes: record.quotes.map((quote) =>
      Quote.restore({
        version: quote.version,
        total: Money.fromCents(quote.totalCents),
        generatedAt: quote.generatedAt,
        decision: quote.decision,
        decidedAt: quote.decidedAt,
        rejectionReason: quote.rejectionReason,
      }),
    ),
  });
}
