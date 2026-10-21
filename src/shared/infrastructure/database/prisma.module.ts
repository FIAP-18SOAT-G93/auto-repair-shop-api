import { Module } from '@nestjs/common';
import { UnitOfWork } from '../../application/unit-of-work.js';
import { PrismaService } from './prisma.service.js';
import { PrismaTransactionHost } from './prisma-transaction-host.js';
import { PrismaUnitOfWork } from './prisma-unit-of-work.js';

@Module({
  providers: [
    PrismaService,
    PrismaTransactionHost,
    { provide: UnitOfWork, useClass: PrismaUnitOfWork },
  ],
  exports: [PrismaTransactionHost, UnitOfWork],
})
export class PrismaModule {}
