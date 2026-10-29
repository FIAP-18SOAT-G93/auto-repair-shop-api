import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/infrastructure/database/prisma.module.js';
import { CatalogModule } from '../catalog/catalog.module.js';
import { CustomerModule } from '../customer/customer.module.js';
import { CustomerDirectory } from './application/ports/customer-directory.js';
import { PartStock } from './application/ports/part-stock.js';
import { ServiceCatalog } from './application/ports/service-catalog.js';
import { CustomerModuleDirectory } from './infrastructure/customer-directory.adapter.js';
import { CatalogModulePartStock } from './infrastructure/part-stock.adapter.js';
import { CatalogModuleServiceCatalog } from './infrastructure/service-catalog.adapter.js';
import { ServiceOrderPersistenceModule } from './service-order-persistence.module.js';

@Module({
  imports: [
    PrismaModule,
    ServiceOrderPersistenceModule,
    CustomerModule,
    CatalogModule,
  ],
  providers: [
    { provide: CustomerDirectory, useClass: CustomerModuleDirectory },
    { provide: ServiceCatalog, useClass: CatalogModuleServiceCatalog },
    { provide: PartStock, useClass: CatalogModulePartStock },
  ],
})
export class ServiceOrderModule {}
