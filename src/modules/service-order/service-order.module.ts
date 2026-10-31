import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/infrastructure/database/prisma.module.js';
import { NotificationModule } from '../../shared/infrastructure/notification/notification.module.js';
import { CatalogModule } from '../catalog/catalog.module.js';
import { CustomerModule } from '../customer/customer.module.js';
import { AddPartToOrderUseCase } from './application/add-part-to-order.use-case.js';
import { AddServiceToOrderUseCase } from './application/add-service-to-order.use-case.js';
import { ApproveQuoteUseCase } from './application/approve-quote.use-case.js';
import { ConcludeDiagnosisUseCase } from './application/conclude-diagnosis.use-case.js';
import { DeliverServiceOrderUseCase } from './application/deliver-service-order.use-case.js';
import { FinishServiceOrderUseCase } from './application/finish-service-order.use-case.js';
import { GetServiceOrderUseCase } from './application/get-service-order.use-case.js';
import { ListServiceOrdersUseCase } from './application/list-service-orders.use-case.js';
import { OpenServiceOrderUseCase } from './application/open-service-order.use-case.js';
import { CustomerDirectory } from './application/ports/customer-directory.js';
import { PartStock } from './application/ports/part-stock.js';
import { ServiceCatalog } from './application/ports/service-catalog.js';
import { RegisterAdditionalRepairUseCase } from './application/register-additional-repair.use-case.js';
import { RejectQuoteUseCase } from './application/reject-quote.use-case.js';
import { ServiceOrderNotifier } from './application/service-order-notifier.js';
import { StartDiagnosisUseCase } from './application/start-diagnosis.use-case.js';
import { VerifyCustomerAccessUseCase } from './application/verify-customer-access.use-case.js';
import { CustomerModuleDirectory } from './infrastructure/customer-directory.adapter.js';
import { CatalogModulePartStock } from './infrastructure/part-stock.adapter.js';
import { CatalogModuleServiceCatalog } from './infrastructure/service-catalog.adapter.js';
import { ServiceOrdersController } from './presentation/service-orders.controller.js';
import { ServiceOrderPersistenceModule } from './service-order-persistence.module.js';

@Module({
  imports: [
    PrismaModule,
    NotificationModule,
    ServiceOrderPersistenceModule,
    CustomerModule,
    CatalogModule,
  ],
  controllers: [ServiceOrdersController],
  providers: [
    OpenServiceOrderUseCase,
    GetServiceOrderUseCase,
    StartDiagnosisUseCase,
    AddServiceToOrderUseCase,
    AddPartToOrderUseCase,
    ConcludeDiagnosisUseCase,
    ApproveQuoteUseCase,
    RejectQuoteUseCase,
    RegisterAdditionalRepairUseCase,
    FinishServiceOrderUseCase,
    DeliverServiceOrderUseCase,
    ListServiceOrdersUseCase,
    VerifyCustomerAccessUseCase,
    ServiceOrderNotifier,
    { provide: CustomerDirectory, useClass: CustomerModuleDirectory },
    { provide: ServiceCatalog, useClass: CatalogModuleServiceCatalog },
    { provide: PartStock, useClass: CatalogModulePartStock },
  ],
  exports: [VerifyCustomerAccessUseCase],
})
export class ServiceOrderModule {}
