import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client.js';
import { Money } from '../../../shared/domain/money.js';
import { PrismaTransactionHost } from '../../../shared/infrastructure/database/prisma-transaction-host.js';
import { ServiceNotFoundError } from '../domain/service.errors.js';
import { Service } from '../domain/service.js';
import {
  type ServicePage,
  ServiceRepository,
} from '../domain/service.repository.js';

type ServiceRecord = Prisma.ServiceGetPayload<object>;

@Injectable()
export class PrismaServiceRepository implements ServiceRepository {
  constructor(private readonly host: PrismaTransactionHost) {}

  async save(service: Service): Promise<void> {
    const data = {
      name: service.name,
      description: service.description,
      priceCents: service.price.cents,
      estimatedMinutes: service.estimatedMinutes,
    };
    await this.host.client.service.upsert({
      where: { id: service.id },
      create: { id: service.id, ...data },
      update: data,
    });
  }

  async findById(id: string): Promise<Service | null> {
    const record = await this.host.client.service.findUnique({
      where: { id },
    });
    return record ? toDomain(record) : null;
  }

  async list(page: number, pageSize: number): Promise<ServicePage> {
    const [records, total] = await Promise.all([
      this.host.client.service.findMany({
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.host.client.service.count(),
    ]);
    return { items: records.map(toDomain), total };
  }

  async delete(id: string): Promise<void> {
    try {
      await this.host.client.service.delete({ where: { id } });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new ServiceNotFoundError();
      }
      throw error;
    }
  }
}

function toDomain(record: ServiceRecord): Service {
  return Service.restore(record.id, {
    name: record.name,
    description: record.description,
    price: Money.fromCents(record.priceCents),
    estimatedMinutes: record.estimatedMinutes,
  });
}
