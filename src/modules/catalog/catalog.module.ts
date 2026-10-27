import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/infrastructure/database/prisma.module.js';
import { CreateServiceUseCase } from './application/create-service.use-case.js';
import { DeleteServiceUseCase } from './application/delete-service.use-case.js';
import { GetServiceUseCase } from './application/get-service.use-case.js';
import { ListServicesUseCase } from './application/list-services.use-case.js';
import { UpdateServiceUseCase } from './application/update-service.use-case.js';
import { ServiceRepository } from './domain/service.repository.js';
import { PrismaServiceRepository } from './infrastructure/prisma-service.repository.js';
import { ServicesController } from './presentation/services.controller.js';

@Module({
  imports: [PrismaModule],
  controllers: [ServicesController],
  providers: [
    CreateServiceUseCase,
    GetServiceUseCase,
    ListServicesUseCase,
    UpdateServiceUseCase,
    DeleteServiceUseCase,
    { provide: ServiceRepository, useClass: PrismaServiceRepository },
  ],
})
export class CatalogModule {}
