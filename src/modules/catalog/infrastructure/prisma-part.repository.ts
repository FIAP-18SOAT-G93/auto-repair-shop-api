import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client.js';
import { Money } from '../../../shared/domain/money.js';
import { Quantity } from '../../../shared/domain/quantity.js';
import { PrismaTransactionHost } from '../../../shared/infrastructure/database/prisma-transaction-host.js';
import { PartNotFoundError } from '../domain/part.errors.js';
import { Part } from '../domain/part.js';
import {
  type PartFilter,
  type PartPage,
  PartRepository,
} from '../domain/part.repository.js';

type PartRecord = Prisma.PartGetPayload<object>;

@Injectable()
export class PrismaPartRepository implements PartRepository {
  constructor(private readonly host: PrismaTransactionHost) {}

  async save(part: Part): Promise<void> {
    const data = {
      name: part.name,
      type: part.type,
      priceCents: part.price.cents,
    };
    await this.host.client.part.upsert({
      where: { id: part.id },
      create: { id: part.id, ...data, quantity: part.quantity.value },
      update: data,
    });
  }

  async findById(id: string): Promise<Part | null> {
    const record = await this.host.client.part.findUnique({ where: { id } });
    return record ? toDomain(record) : null;
  }

  async list(
    filter: PartFilter,
    page: number,
    pageSize: number,
  ): Promise<PartPage> {
    const where = filter.onlyOutOfStock ? { quantity: 0 } : {};
    const [records, total] = await Promise.all([
      this.host.client.part.findMany({
        where,
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.host.client.part.count({ where }),
    ]);
    return { items: records.map(toDomain), total };
  }

  async delete(id: string): Promise<void> {
    try {
      await this.host.client.part.delete({ where: { id } });
    } catch (error) {
      throw translateNotFound(error);
    }
  }

  async deductStock(id: string, amount: Quantity): Promise<boolean> {
    const affected = await this.host.client.$executeRaw`
      UPDATE "parts"
      SET "quantity" = "quantity" - ${amount.value}, "updated_at" = NOW()
      WHERE "id" = ${id}::uuid AND "quantity" >= ${amount.value}
    `;
    return affected === 1;
  }

  async addStock(id: string, amount: Quantity): Promise<void> {
    try {
      await this.host.client.part.update({
        where: { id },
        data: { quantity: { increment: amount.value } },
      });
    } catch (error) {
      throw translateNotFound(error);
    }
  }
}

function translateNotFound(error: unknown): unknown {
  return error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2025'
    ? new PartNotFoundError()
    : error;
}

function toDomain(record: PartRecord): Part {
  return Part.restore(record.id, {
    name: record.name,
    type: record.type,
    price: Money.fromCents(record.priceCents),
    quantity: Quantity.of(record.quantity),
  });
}
