import { AsyncLocalStorage } from 'node:async_hooks';
import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from './prisma.service.js';

/**
 * Entrega aos repositórios o cliente certo: a transação em andamento,
 * se houver uma, ou o PrismaService fora de transações.
 */
@Injectable()
export class PrismaTransactionHost {
  readonly #storage = new AsyncLocalStorage<Prisma.TransactionClient>();

  constructor(private readonly prisma: PrismaService) {}

  get client(): Prisma.TransactionClient {
    return this.#storage.getStore() ?? this.prisma;
  }

  get isInTransaction(): boolean {
    return this.#storage.getStore() !== undefined;
  }

  runWith<T>(tx: Prisma.TransactionClient, work: () => Promise<T>): Promise<T> {
    return this.#storage.run(tx, work);
  }
}
