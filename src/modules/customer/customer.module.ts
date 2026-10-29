import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/infrastructure/database/prisma.module.js';
import { ServiceOrderPersistenceModule } from '../service-order/service-order-persistence.module.js';
import { CreateCustomerUseCase } from './application/create-customer.use-case.js';
import { DeleteCustomerUseCase } from './application/delete-customer.use-case.js';
import { FindCustomerByDocumentUseCase } from './application/find-customer-by-document.use-case.js';
import { GetCustomerUseCase } from './application/get-customer.use-case.js';
import { ListCustomersUseCase } from './application/list-customers.use-case.js';
import { UpdateCustomerUseCase } from './application/update-customer.use-case.js';
import { CustomerRepository } from './domain/customer.repository.js';
import { VehicleRepository } from './domain/vehicle.repository.js';
import { PrismaCustomerRepository } from './infrastructure/prisma-customer.repository.js';
import { PrismaVehicleRepository } from './infrastructure/prisma-vehicle.repository.js';
import { CustomersController } from './presentation/customers.controller.js';
import { VehiclesController } from './presentation/vehicles.controller.js';
import { CreateVehicleUseCase } from './application/create-vehicle.use-case.js';
import { GetVehicleUseCase } from './application/get-vehicle.use-case.js';
import { FindVehicleByPlateUseCase } from './application/find-vehicle-by-plate.use-case.js';
import { ListVehiclesUseCase } from './application/list-vehicles.use-case.js';
import { UpdateVehicleUseCase } from './application/update-vehicle.use-case.js';
import { DeleteVehicleUseCase } from './application/delete-vehicle.use-case.js';

@Module({
  imports: [PrismaModule, ServiceOrderPersistenceModule],
  controllers: [CustomersController, VehiclesController],
  providers: [
    CreateCustomerUseCase,
    GetCustomerUseCase,
    FindCustomerByDocumentUseCase,
    ListCustomersUseCase,
    UpdateCustomerUseCase,
    DeleteCustomerUseCase,
    CreateVehicleUseCase,
    GetVehicleUseCase,
    FindVehicleByPlateUseCase,
    ListVehiclesUseCase,
    UpdateVehicleUseCase,
    DeleteVehicleUseCase,
    { provide: CustomerRepository, useClass: PrismaCustomerRepository },
    { provide: VehicleRepository, useClass: PrismaVehicleRepository },
  ],
  exports: [
    FindCustomerByDocumentUseCase,
    CreateCustomerUseCase,
    FindVehicleByPlateUseCase,
    CreateVehicleUseCase,
  ],
})
export class CustomerModule {}
