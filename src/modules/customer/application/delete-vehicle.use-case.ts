import { Injectable } from '@nestjs/common';
import {
  VehicleHasOpenServiceOrdersError,
  VehicleNotFoundError,
} from '../domain/vehicle.errors.js';
import { VehicleRepository } from '../domain/vehicle.repository.js';
import { ServiceOrderChecker } from './service-order-checker.js';

@Injectable()
export class DeleteVehicleUseCase {
  constructor(
    private readonly vehicles: VehicleRepository,
    private readonly serviceOrders: ServiceOrderChecker,
  ) {}

  async execute(id: string): Promise<void> {
    const vehicle = await this.vehicles.findById(id);
    if (!vehicle) throw new VehicleNotFoundError();

    if (await this.serviceOrders.vehicleHasOpenServiceOrders(vehicle.id)) {
      throw new VehicleHasOpenServiceOrdersError();
    }

    vehicle.delete(new Date());
    await this.vehicles.save(vehicle);
  }
}
