import { Injectable } from '@nestjs/common';
import { CreateCustomerUseCase } from '../../customer/application/create-customer.use-case.js';
import { CreateVehicleUseCase } from '../../customer/application/create-vehicle.use-case.js';
import { FindCustomerByDocumentUseCase } from '../../customer/application/find-customer-by-document.use-case.js';
import { FindVehicleByPlateUseCase } from '../../customer/application/find-vehicle-by-plate.use-case.js';
import { CustomerNotFoundError } from '../../customer/domain/customer.errors.js';
import { VehicleNotFoundError } from '../../customer/domain/vehicle.errors.js';
import {
  CustomerDirectory,
  type CustomerRef,
  type NewCustomer,
  type NewVehicle,
  type VehicleRef,
} from '../application/ports/customer-directory.js';

@Injectable()
export class CustomerModuleDirectory implements CustomerDirectory {
  constructor(
    private readonly findCustomer: FindCustomerByDocumentUseCase,
    private readonly createCustomer: CreateCustomerUseCase,
    private readonly findVehicle: FindVehicleByPlateUseCase,
    private readonly createVehicle: CreateVehicleUseCase,
  ) {}

  async findCustomerByDocument(document: string): Promise<CustomerRef | null> {
    try {
      const { id } = await this.findCustomer.execute(document);
      return { id };
    } catch (error) {
      if (error instanceof CustomerNotFoundError) return null;
      throw error;
    }
  }

  async registerCustomer(input: NewCustomer): Promise<CustomerRef> {
    const { id } = await this.createCustomer.execute(input);
    return { id };
  }

  async findVehicleByPlate(plate: string): Promise<VehicleRef | null> {
    try {
      const { id, customerId } = await this.findVehicle.execute(plate);
      return { id, customerId };
    } catch (error) {
      if (error instanceof VehicleNotFoundError) return null;
      throw error;
    }
  }

  async registerVehicle(input: NewVehicle): Promise<VehicleRef> {
    const { id, customerId } = await this.createVehicle.execute(input);
    return { id, customerId };
  }
}
