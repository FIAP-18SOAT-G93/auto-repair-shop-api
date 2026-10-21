import { Injectable } from '@nestjs/common';
import { UnitOfWork } from '../../application/unit-of-work.js';
import { PrismaService } from './prisma.service.js';
import { PrismaTransactionHost } from './prisma-transaction-host.js';

@Injectable()
export class PrismaUnitOfWork implements UnitOfWork {
  constructor(
    private readonly prisma: PrismaService,
    private readonly host: PrismaTransactionHost,
  ) {}

  run<T>(work: () => Promise<T>): Promise<T> {
    if (this.host.isInTransaction) {
      return work();
    }
    return this.prisma.$transaction((tx) => this.host.runWith(tx, work));
  }
}
