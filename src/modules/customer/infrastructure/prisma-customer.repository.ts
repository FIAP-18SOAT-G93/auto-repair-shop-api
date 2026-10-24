import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client.js';
import { PrismaTransactionHost } from '../../../shared/infrastructure/database/prisma-transaction-host.js';
import { Customer } from '../domain/customer.js';
import { DocumentAlreadyRegisteredError } from '../domain/customer.errors.js';
import {
  CustomerRepository,
  type CustomerPage,
} from '../domain/customer.repository.js';
import { Document } from '../domain/document.js';

type CustomerRecord = Prisma.CustomerGetPayload<object>;

/** Filtro aplicado em todas as buscas: os clientes removidos nunca são devolvidos. */
const ACTIVE = { deletedAt: null } satisfies Prisma.CustomerWhereInput;

@Injectable()
export class PrismaCustomerRepository implements CustomerRepository {
  constructor(private readonly host: PrismaTransactionHost) {}

  async save(customer: Customer): Promise<void> {
    const data = {
      name: customer.name,
      document: customer.document.value,
      email: customer.email,
      phone: customer.phone,
      deletedAt: customer.deletedAt,
    };
    try {
      await this.host.client.customer.upsert({
        where: { id: customer.id },
        create: { id: customer.id, ...data },
        update: data,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new DocumentAlreadyRegisteredError();
      }
      throw error;
    }
  }

  async findById(id: string): Promise<Customer | null> {
    const record = await this.host.client.customer.findFirst({
      where: { id, ...ACTIVE },
    });
    return record ? toDomain(record) : null;
  }

  async findByDocument(document: Document): Promise<Customer | null> {
    const record = await this.host.client.customer.findFirst({
      where: { document: document.value, ...ACTIVE },
    });
    return record ? toDomain(record) : null;
  }

  async list(page: number, pageSize: number): Promise<CustomerPage> {
    const [records, total] = await Promise.all([
      this.host.client.customer.findMany({
        where: ACTIVE,
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.host.client.customer.count({ where: ACTIVE }),
    ]);

    return { items: records.map(toDomain), total };
  }
}

function toDomain(record: CustomerRecord): Customer {
  return Customer.restore(record.id, {
    name: record.name,
    document: Document.create(record.document),
    email: record.email,
    phone: record.phone,
    deletedAt: record.deletedAt,
  });
}
