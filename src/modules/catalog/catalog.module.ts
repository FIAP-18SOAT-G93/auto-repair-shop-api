import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/infrastructure/database/prisma.module.js';
import { CreatePartUseCase } from './application/create-part.use-case.js';
import { CreateServiceUseCase } from './application/create-service.use-case.js';
import { DeductStockUseCase } from './application/deduct-stock.use-case.js';
import { DeletePartUseCase } from './application/delete-part.use-case.js';
import { DeleteServiceUseCase } from './application/delete-service.use-case.js';
import { GetPartUseCase } from './application/get-part.use-case.js';
import { GetServiceUseCase } from './application/get-service.use-case.js';
import { ListPartsUseCase } from './application/list-parts.use-case.js';
import { ListServicesUseCase } from './application/list-services.use-case.js';
import { RegisterStockEntryUseCase } from './application/register-stock-entry.use-case.js';
import { ReverseStockUseCase } from './application/reverse-stock.use-case.js';
import { UpdatePartUseCase } from './application/update-part.use-case.js';
import { UpdateServiceUseCase } from './application/update-service.use-case.js';
import { PartRepository } from './domain/part.repository.js';
import { ServiceRepository } from './domain/service.repository.js';
import { PrismaPartRepository } from './infrastructure/prisma-part.repository.js';
import { PrismaServiceRepository } from './infrastructure/prisma-service.repository.js';
import { PartsController } from './presentation/parts.controller.js';
import { ServicesController } from './presentation/services.controller.js';

@Module({
  imports: [PrismaModule],
  controllers: [ServicesController, PartsController],
  providers: [
    CreateServiceUseCase,
    GetServiceUseCase,
    ListServicesUseCase,
    UpdateServiceUseCase,
    DeleteServiceUseCase,
    CreatePartUseCase,
    GetPartUseCase,
    ListPartsUseCase,
    UpdatePartUseCase,
    DeletePartUseCase,
    RegisterStockEntryUseCase,
    DeductStockUseCase,
    ReverseStockUseCase,
    { provide: ServiceRepository, useClass: PrismaServiceRepository },
    { provide: PartRepository, useClass: PrismaPartRepository },
  ],
  exports: [GetServiceUseCase, DeductStockUseCase, ReverseStockUseCase],
})
export class CatalogModule {}
