import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/infrastructure/database/prisma.module.js';
import { CreateCustomerUseCase } from './application/create-customer.use-case.js';
import { DeleteCustomerUseCase } from './application/delete-customer.use-case.js';
import { FindCustomerByDocumentUseCase } from './application/find-customer-by-document.use-case.js';
import { GetCustomerUseCase } from './application/get-customer.use-case.js';
import { ListCustomersUseCase } from './application/list-customers.use-case.js';
import { ServiceOrderChecker } from './application/service-order-checker.js';
import { UpdateCustomerUseCase } from './application/update-customer.use-case.js';
import { CustomerRepository } from './domain/customer.repository.js';
import { NoServiceOrdersChecker } from './infrastructure/no-service-orders.checker.js';
import { PrismaCustomerRepository } from './infrastructure/prisma-customer.repository.js';
import { CustomersController } from './presentation/customers.controller.js';

@Module({
  imports: [PrismaModule],
  controllers: [CustomersController],
  providers: [
    CreateCustomerUseCase,
    GetCustomerUseCase,
    FindCustomerByDocumentUseCase,
    ListCustomersUseCase,
    UpdateCustomerUseCase,
    DeleteCustomerUseCase,
    { provide: CustomerRepository, useClass: PrismaCustomerRepository },
    { provide: ServiceOrderChecker, useClass: NoServiceOrdersChecker },
  ],
})
export class CustomerModule {}
