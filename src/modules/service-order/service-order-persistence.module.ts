import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/infrastructure/database/prisma.module.js';
import { ServiceOrderChecker } from '../customer/application/service-order-checker.js';
import { ServiceOrderRepository } from './domain/service-order.repository.js';
import { PrismaServiceOrderRepository } from './infrastructure/prisma-service-order.repository.js';
import { RepositoryServiceOrderChecker } from './infrastructure/service-order-checker.adapter.js';

@Module({
  imports: [PrismaModule],
  providers: [
    { provide: ServiceOrderRepository, useClass: PrismaServiceOrderRepository },
    { provide: ServiceOrderChecker, useClass: RepositoryServiceOrderChecker },
  ],
  exports: [ServiceOrderRepository, ServiceOrderChecker],
})
export class ServiceOrderPersistenceModule {}
