import { Injectable } from '@nestjs/common';
import { CustomerNotFoundError } from '../domain/customer.errors.js';
import { CustomerRepository } from '../domain/customer.repository.js';
import { LicensePlate } from '../domain/license-plate.js';
import { LicensePlateAlreadyRegisteredError } from '../domain/vehicle.errors.js';
import { Vehicle } from '../domain/vehicle.js';
import { VehicleRepository } from '../domain/vehicle.repository.js';
import { toVehicleOutput, type VehicleOutput } from './vehicle.output.js';

export interface CreateVehicleInput {
  customerId: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
}

@Injectable()
export class CreateVehicleUseCase {
  constructor(
    private readonly vehicles: VehicleRepository,
    private readonly customers: CustomerRepository,
  ) {}

  async execute(input: CreateVehicleInput): Promise<VehicleOutput> {
    const licensePlate = LicensePlate.create(input.plate);
    if (!(await this.customers.findById(input.customerId))) {
      throw new CustomerNotFoundError();
    }
    if (await this.vehicles.findByPlate(licensePlate)) {
      throw new LicensePlateAlreadyRegisteredError();
    }

    const vehicle = Vehicle.create(
      { ...input, plate: licensePlate },
      new Date(),
    );
    await this.vehicles.save(vehicle);
    return toVehicleOutput(vehicle);
  }
}
